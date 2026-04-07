"use server";

import { createClient, createAdminClient } from "@/lib/supabase-server";

import { generateMatchup } from "@/lib/matchmaking";
import { signMatchup, verifyMatchupToken } from "@/lib/matchup-token";
import { VoteResult, Matchup, College } from "@/types";
import { headers, cookies } from "next/headers";
import crypto from "crypto";
import { DEFAULT_TOPIC_SLUG } from "@/lib/topics";

const RATE_LIMIT_MS = 1500;
const DAILY_VOTE_CAP = 500;

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "cr_salt_2024").digest("hex").slice(0, 32);
}

function withToken(matchup: Matchup | null): Matchup | null {
  if (!matchup) return null;
  return { ...matchup, token: signMatchup(matchup.left.id, matchup.right.id) };
}

/** Returns topic id and system flag, or null if not found. */
async function getTopicInfo(slug: string): Promise<{ id: string; is_system: boolean } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, is_system")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

// ── System forum path: colleges + elo_ratings ─────────────────────────────────

async function fetchCollegesForTopic(topicId: string): Promise<College[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("elo_ratings")
    .select(`rating, wins, losses, matches_played, colleges(*)`)
    .eq("topic_id", topicId)
    .order("matches_played", { ascending: true });

  if (!data) return [];
  return data.map(r => {
    const college = r.colleges as unknown as College;
    return { ...college, elo_rating: r.rating, wins: r.wins, losses: r.losses, comparisons: r.matches_played };
  });
}

// ── User forum path: topic_items ──────────────────────────────────────────────

async function fetchItemsForForum(topicId: string): Promise<College[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_items")
    .select("id, name, slug, image_url, elo_rating, comparisons, wins, losses, skips, created_at, updated_at")
    .eq("topic_id", topicId)
    .order("comparisons", { ascending: true });

  if (!data) return [];
  // Map topic_items shape onto College so the shared matchmaking + voting UI works unchanged
  return data.map(item => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    logo_url: item.image_url ?? null,
    elo_rating: item.elo_rating,
    comparisons: item.comparisons,
    wins: item.wins,
    losses: item.losses,
    skips: item.skips ?? 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

async function fetchItemsForTopic(topicId: string, isSystem: boolean): Promise<College[]> {
  return isSystem ? fetchCollegesForTopic(topicId) : fetchItemsForForum(topicId);
}

// ── Vote submission ───────────────────────────────────────────────────────────

export async function submitVote(
  winnerId: string,
  loserId: string,
  sessionId: string,
  previousMatchupIds: [string, string],
  topicSlug: string = DEFAULT_TOPIC_SLUG,
  matchupToken?: string
): Promise<VoteResult> {
  try {
    if (matchupToken) {
      if (!verifyMatchupToken(matchupToken, winnerId, loserId)) {
        return { success: false, nextMatchup: null, error: "Invalid or expired matchup. Please refresh." };
      }
    }

    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const ipHash = hashIp(ip);

    const supabase = await createClient();
    const admin = createAdminClient();

    // Rate limit — check both vote tables so user forum votes are covered
    const cutoff = new Date(Date.now() - RATE_LIMIT_MS).toISOString();
    const [{ data: recentVote }, { data: recentTopicVote }] = await Promise.all([
      supabase.from("votes").select("id").eq("ip_hash", ipHash).gte("created_at", cutoff).limit(1).maybeSingle(),
      supabase.from("topic_votes").select("id").eq("ip_hash", ipHash).gte("created_at", cutoff).limit(1).maybeSingle(),
    ]);
    if (recentVote || recentTopicVote) return { success: false, nextMatchup: null, error: "Too fast! Slow down." };

    // Daily cap — sum across both vote tables
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [{ count: collegeCount }, { count: topicCount }] = await Promise.all([
      supabase.from("votes").select("*", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", dayAgo),
      supabase.from("topic_votes").select("*", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", dayAgo),
    ]);
    if ((collegeCount ?? 0) + (topicCount ?? 0) >= DAILY_VOTE_CAP) {
      return { success: false, nextMatchup: null, error: "Daily vote limit reached. Come back tomorrow!" };
    }

    const topic = await getTopicInfo(topicSlug);
    if (!topic) return { success: false, nextMatchup: null, error: "Forum not found." };

    if (topic.is_system) {
      // ── System forum: atomic ELO update + vote insert ──────────────────────
      const { error: voteError } = await admin.rpc("submit_system_vote", {
        p_winner_id: winnerId,
        p_loser_id: loserId,
        p_topic_id: topic.id,
        p_ip_hash: ipHash,
        p_session_id: sessionId,
      });
      if (voteError) {
        return { success: false, nextMatchup: null, error: "Vote failed. Please try again." };
      }

    } else {
      // ── User forum: atomic ELO update + vote insert ────────────────────────
      const { error: voteError } = await admin.rpc("submit_topic_item_vote", {
        p_winner_id: winnerId,
        p_loser_id: loserId,
        p_topic_id: topic.id,
        p_ip_hash: ipHash,
        p_session_id: sessionId,
      });
      if (voteError) {
        return { success: false, nextMatchup: null, error: "Vote failed. Please try again." };
      }
    }

    // Increment vote cookies
    const cookieStore = await cookies();
    const currentCount = parseInt(cookieStore.get("cr_votes")?.value ?? "0", 10);
    cookieStore.set("cr_votes", String(currentCount + 1), { maxAge: 60 * 60 * 24 * 365, path: "/", httpOnly: true, sameSite: "lax" });
    const topicCookieKey = `cr_votes_${topicSlug}`;
    const currentTopicCount = parseInt(cookieStore.get(topicCookieKey)?.value ?? "0", 10);
    const newTopicVoteCount = currentTopicCount + 1;
    cookieStore.set(topicCookieKey, String(newTopicVoteCount), { maxAge: 60 * 60 * 24 * 365, path: "/", httpOnly: true, sameSite: "lax" });

    // Next matchup
    const allItems = await fetchItemsForTopic(topic.id, topic.is_system);
    const prevLeft = allItems.find(c => c.id === previousMatchupIds[0]);
    const prevRight = allItems.find(c => c.id === previousMatchupIds[1]);
    const previousMatchup = prevLeft && prevRight ? { left: prevLeft, right: prevRight } : null;
    const nextMatchup = withToken(generateMatchup(allItems, previousMatchup ?? undefined));

    if (nextMatchup) {
      cookieStore.set("cr_pending_matchup", `${nextMatchup.left.id}|${nextMatchup.right.id}|${topicSlug}`, { maxAge: 60 * 60, path: "/", httpOnly: true, sameSite: "lax" });
    }

    return { success: true, nextMatchup, voteCount: newTopicVoteCount };
  } catch (err) {
    console.error("Vote error:", err);
    return { success: false, nextMatchup: null, error: "Something went wrong." };
  }
}

// ── Skip submission ───────────────────────────────────────────────────────────

export async function submitSkip(
  leftId: string,
  rightId: string,
  previousMatchupIds: [string, string],
  topicSlug: string = DEFAULT_TOPIC_SLUG
): Promise<{ nextMatchup: Matchup | null }> {
  try {
    const admin = createAdminClient();
    const topic = await getTopicInfo(topicSlug);
    if (!topic) return { nextMatchup: null };

    if (topic.is_system) {
      const { data: colleges } = await admin.from("colleges").select("id, skips").in("id", [leftId, rightId]);
      if (colleges && colleges.length === 2) {
        for (const college of colleges) {
          await admin.from("colleges").update({ skips: college.skips + 1 }).eq("id", college.id);
        }
      }
      const [canonA, canonB] = leftId < rightId ? [leftId, rightId] : [rightId, leftId];
      await admin.rpc("record_matchup_skip", { p_college_a_id: canonA, p_college_b_id: canonB });
    } else {
      const { data: items } = await admin.from("topic_items").select("id, skips").in("id", [leftId, rightId]);
      if (items && items.length === 2) {
        for (const item of items) {
          await admin.from("topic_items").update({ skips: (item.skips ?? 0) + 1 }).eq("id", item.id);
        }
      }
      await admin.rpc("record_topic_item_skip", { p_topic_id: topic.id, p_item_a_id: leftId < rightId ? leftId : rightId, p_item_b_id: leftId < rightId ? rightId : leftId });
    }

    const allItems = await fetchItemsForTopic(topic.id, topic.is_system);
    const prevLeft = allItems.find(c => c.id === previousMatchupIds[0]);
    const prevRight = allItems.find(c => c.id === previousMatchupIds[1]);
    const previousMatchup = prevLeft && prevRight ? { left: prevLeft, right: prevRight } : null;
    const nextMatchup = withToken(generateMatchup(allItems, previousMatchup ?? undefined));

    if (nextMatchup) {
      const cookieStore = await cookies();
      cookieStore.set("cr_pending_matchup", `${nextMatchup.left.id}|${nextMatchup.right.id}|${topicSlug}`, { maxAge: 60 * 60, path: "/", httpOnly: true, sameSite: "lax" });
    }

    return { nextMatchup };
  } catch (err) {
    console.error("Skip error:", err);
    return { nextMatchup: null };
  }
}

// ── Impression tracking ───────────────────────────────────────────────────────

export async function recordMatchupImpression(leftId: string, rightId: string, topicSlug: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const pending = cookieStore.get("cr_pending_matchup")?.value;

    if (pending) {
      const [pendingLeft, pendingRight, pendingTopic] = pending.split("|");
      const sameTopicDifferentPair = pendingTopic === topicSlug && (pendingLeft !== leftId || pendingRight !== rightId);

      if (sameTopicDifferentPair && pendingLeft && pendingRight) {
        const topic = await getTopicInfo(topicSlug);
        if (topic) {
          const admin = createAdminClient();
          if (topic.is_system) {
            const { data: abandonedColleges } = await admin.from("colleges").select("id, skips").in("id", [pendingLeft, pendingRight]);
            if (abandonedColleges && abandonedColleges.length === 2) {
              for (const college of abandonedColleges) {
                await admin.from("colleges").update({ skips: college.skips + 1 }).eq("id", college.id);
              }
            }
            const [canonA, canonB] = pendingLeft < pendingRight ? [pendingLeft, pendingRight] : [pendingRight, pendingLeft];
            await admin.rpc("record_matchup_skip", { p_college_a_id: canonA, p_college_b_id: canonB });
          } else {
            const { data: items } = await admin.from("topic_items").select("id, skips").in("id", [pendingLeft, pendingRight]);
            if (items && items.length === 2) {
              for (const item of items) {
                await admin.from("topic_items").update({ skips: (item.skips ?? 0) + 1 }).eq("id", item.id);
              }
            }
          }
        }
      }
    }

    cookieStore.set("cr_pending_matchup", `${leftId}|${rightId}|${topicSlug}`, { maxAge: 60 * 60, path: "/", httpOnly: true, sameSite: "lax" });
  } catch (err) {
    console.error("Impression error:", err);
  }
}

export async function getTopicVoteCount(topicSlug: string): Promise<number> {
  const cookieStore = await cookies();
  return parseInt(cookieStore.get(`cr_votes_${topicSlug}`)?.value ?? "0", 10);
}

export async function getInitialMatchup(topicSlug: string = DEFAULT_TOPIC_SLUG): Promise<Matchup | null> {
  const topic = await getTopicInfo(topicSlug);
  if (!topic) return null;

  const items = await fetchItemsForTopic(topic.id, topic.is_system);
  if (items.length < 2) return null;

  return withToken(generateMatchup(items));
}
