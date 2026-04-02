"use server";

import { createClient, createAdminClient } from "@/lib/supabase-server";
import { calculateNewRatings } from "@/lib/elo";
import { generateMatchup } from "@/lib/matchmaking";
import { signMatchup, verifyMatchupToken } from "@/lib/matchup-token";
import { VoteResult, Matchup, College } from "@/types";
import { headers, cookies } from "next/headers";
import crypto from "crypto";
import { LEADERBOARD_VOTE_THRESHOLD } from "@/lib/constants";
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

async function getTopicId(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", slug)
    .single();
  return data?.id ?? null;
}

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
    return {
      ...college,
      elo_rating: r.rating,
      wins: r.wins,
      losses: r.losses,
      comparisons: r.matches_played,
    };
  });
}

export async function submitVote(
  winnerId: string,
  loserId: string,
  sessionId: string,
  previousMatchupIds: [string, string],
  topicSlug: string = DEFAULT_TOPIC_SLUG,
  matchupToken?: string
): Promise<VoteResult> {
  try {
    // Verify matchup token — reject votes not backed by a server-issued token
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

    // Rate limit: check for a recent vote from this IP
    const cutoff = new Date(Date.now() - RATE_LIMIT_MS).toISOString();
    const { data: recentVote } = await supabase
      .from("votes")
      .select("id")
      .eq("ip_hash", ipHash)
      .gte("created_at", cutoff)
      .limit(1)
      .maybeSingle();

    if (recentVote) {
      return { success: false, nextMatchup: null, error: "Too fast! Slow down." };
    }

    // Daily cap: max DAILY_VOTE_CAP votes per IP per 24 hours
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dailyCount } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", dayAgo);

    if ((dailyCount ?? 0) >= DAILY_VOTE_CAP) {
      return { success: false, nextMatchup: null, error: "Daily vote limit reached. Come back tomorrow!" };
    }

    const topicId = await getTopicId(topicSlug);
    if (!topicId) return { success: false, nextMatchup: null, error: "Topic not found." };

    // Fetch elo_ratings for both colleges in this topic
    const { data: ratings } = await supabase
      .from("elo_ratings")
      .select("*")
      .in("college_id", [winnerId, loserId])
      .eq("topic_id", topicId);

    if (!ratings || ratings.length !== 2) {
      return { success: false, nextMatchup: null, error: "Ratings not found." };
    }

    const winnerRating = ratings.find(r => r.college_id === winnerId)!;
    const loserRating = ratings.find(r => r.college_id === loserId)!;

    const { winnerNew, loserNew } = calculateNewRatings(
      winnerRating.rating,
      loserRating.rating
    );

    await admin
      .from("elo_ratings")
      .update({
        rating: winnerNew,
        wins: winnerRating.wins + 1,
        matches_played: winnerRating.matches_played + 1,
      })
      .eq("college_id", winnerId)
      .eq("topic_id", topicId);

    await admin
      .from("elo_ratings")
      .update({
        rating: loserNew,
        losses: loserRating.losses + 1,
        matches_played: loserRating.matches_played + 1,
      })
      .eq("college_id", loserId)
      .eq("topic_id", topicId);

    await admin.from("votes").insert({
      winner_college_id: winnerId,
      loser_college_id: loserId,
      ip_hash: ipHash,
      session_id: sessionId,
      topic_id: topicId,
    });

    // Record head-to-head (topic-agnostic aggregate)
    const [canonA, canonB] = winnerId < loserId ? [winnerId, loserId] : [loserId, winnerId];
    await admin.rpc("record_matchup_vote", {
      p_college_a_id: canonA,
      p_college_b_id: canonB,
      p_winner_id: winnerId,
    });

    // Increment persistent vote cookies (global + per-topic)
    const cookieStore = await cookies();
    const currentCount = parseInt(cookieStore.get("cr_votes")?.value ?? "0", 10);
    const newVoteCount = currentCount + 1;
    cookieStore.set("cr_votes", String(newVoteCount), {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    const topicCookieKey = `cr_votes_${topicSlug}`;
    const currentTopicCount = parseInt(cookieStore.get(topicCookieKey)?.value ?? "0", 10);
    const newTopicVoteCount = currentTopicCount + 1;
    cookieStore.set(topicCookieKey, String(newTopicVoteCount), {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    // Generate and sign next matchup for this topic
    const allColleges = await fetchCollegesForTopic(topicId);
    const prevLeft = allColleges.find(c => c.id === previousMatchupIds[0]);
    const prevRight = allColleges.find(c => c.id === previousMatchupIds[1]);
    const previousMatchup =
      prevLeft && prevRight ? { left: prevLeft, right: prevRight } : null;
    const nextMatchup = withToken(generateMatchup(allColleges, previousMatchup ?? undefined));

    // Advance the pending matchup cookie to the next matchup so that
    // recordMatchupImpression doesn't misread the vote transition as a refresh-skip
    if (nextMatchup) {
      cookieStore.set("cr_pending_matchup", `${nextMatchup.left.id}|${nextMatchup.right.id}|${topicSlug}`, {
        maxAge: 60 * 60,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return { success: true, nextMatchup, voteCount: newTopicVoteCount };
  } catch (err) {
    console.error("Vote error:", err);
    return { success: false, nextMatchup: null, error: "Something went wrong." };
  }
}

export async function submitSkip(
  leftId: string,
  rightId: string,
  previousMatchupIds: [string, string],
  topicSlug: string = DEFAULT_TOPIC_SLUG
): Promise<{ nextMatchup: Matchup | null }> {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const topicId = await getTopicId(topicSlug);
    if (!topicId) return { nextMatchup: null };

    // Skips are topic-agnostic — tracked on colleges table
    const { data: colleges } = await supabase
      .from("colleges")
      .select("id, skips")
      .in("id", [leftId, rightId]);

    if (colleges && colleges.length === 2) {
      for (const college of colleges) {
        await admin
          .from("colleges")
          .update({ skips: college.skips + 1 })
          .eq("id", college.id);
      }
    }

    const [canonA, canonB] = leftId < rightId ? [leftId, rightId] : [rightId, leftId];
    await admin.rpc("record_matchup_skip", {
      p_college_a_id: canonA,
      p_college_b_id: canonB,
    });

    const allColleges = await fetchCollegesForTopic(topicId);
    const prevLeft = allColleges.find(c => c.id === previousMatchupIds[0]);
    const prevRight = allColleges.find(c => c.id === previousMatchupIds[1]);
    const previousMatchup =
      prevLeft && prevRight ? { left: prevLeft, right: prevRight } : null;
    const nextMatchup = withToken(generateMatchup(allColleges, previousMatchup ?? undefined));

    // Advance the pending matchup cookie so recordMatchupImpression doesn't
    // misread the skip transition as another refresh-skip
    if (nextMatchup) {
      const cookieStore = await cookies();
      cookieStore.set("cr_pending_matchup", `${nextMatchup.left.id}|${nextMatchup.right.id}|${topicSlug}`, {
        maxAge: 60 * 60,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return { nextMatchup };
  } catch (err) {
    console.error("Skip error:", err);
    return { nextMatchup: null };
  }
}

/**
 * Called by the client whenever a new matchup becomes visible.
 * If the previously stored pending matchup (same topic) was never voted on
 * or skipped, it means the user refreshed to avoid it — record it as a skip.
 */
export async function recordMatchupImpression(
  leftId: string,
  rightId: string,
  topicSlug: string
): Promise<void> {
  try {
    const cookieStore = await cookies();
    const pending = cookieStore.get("cr_pending_matchup")?.value;

    if (pending) {
      const [pendingLeft, pendingRight, pendingTopic] = pending.split("|");
      const sameTopicDifferentPair =
        pendingTopic === topicSlug &&
        (pendingLeft !== leftId || pendingRight !== rightId);

      if (sameTopicDifferentPair && pendingLeft && pendingRight) {
        const admin = createAdminClient();

        // Increment skip count on both abandoned colleges
        const { data: abandonedColleges } = await admin
          .from("colleges")
          .select("id, skips")
          .in("id", [pendingLeft, pendingRight]);

        if (abandonedColleges && abandonedColleges.length === 2) {
          for (const college of abandonedColleges) {
            await admin
              .from("colleges")
              .update({ skips: college.skips + 1 })
              .eq("id", college.id);
          }
        }

        // Record in matchup_stats
        const [canonA, canonB] =
          pendingLeft < pendingRight
            ? [pendingLeft, pendingRight]
            : [pendingRight, pendingLeft];
        await admin.rpc("record_matchup_skip", {
          p_college_a_id: canonA,
          p_college_b_id: canonB,
        });
      }
    }

    // Update pending cookie to current matchup
    cookieStore.set("cr_pending_matchup", `${leftId}|${rightId}|${topicSlug}`, {
      maxAge: 60 * 60, // 1 hour — stale impressions should not trigger skips
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  } catch (err) {
    console.error("Impression error:", err);
  }
}

export async function getTopicVoteCount(topicSlug: string): Promise<number> {
  const cookieStore = await cookies();
  return parseInt(cookieStore.get(`cr_votes_${topicSlug}`)?.value ?? "0", 10);
}

export async function getInitialMatchup(
  topicSlug: string = DEFAULT_TOPIC_SLUG
): Promise<Matchup | null> {
  const topicId = await getTopicId(topicSlug);
  if (!topicId) return null;

  const colleges = await fetchCollegesForTopic(topicId);
  if (colleges.length < 2) return null;

  return withToken(generateMatchup(colleges));
}
