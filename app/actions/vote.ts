"use server";

import { createClient, createAdminClient } from "@/lib/supabase-server";
import { calculateNewRatings } from "@/lib/elo";
import { generateMatchup } from "@/lib/matchmaking";
import { VoteResult, Matchup, College } from "@/types";
import { headers, cookies } from "next/headers";
import crypto from "crypto";
import { LEADERBOARD_VOTE_THRESHOLD } from "@/lib/constants";
import { DEFAULT_TOPIC_SLUG } from "@/lib/topics";

const RATE_LIMIT_MS = 500;

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "cr_salt_2024").digest("hex").slice(0, 32);
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
  topicSlug: string = DEFAULT_TOPIC_SLUG
): Promise<VoteResult> {
  try {
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

    // Increment persistent vote cookie
    const cookieStore = await cookies();
    const currentCount = parseInt(cookieStore.get("cr_votes")?.value ?? "0", 10);
    const newVoteCount = currentCount + 1;
    cookieStore.set("cr_votes", String(newVoteCount), {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    // Generate next matchup for this topic
    const allColleges = await fetchCollegesForTopic(topicId);
    const prevLeft = allColleges.find(c => c.id === previousMatchupIds[0]);
    const prevRight = allColleges.find(c => c.id === previousMatchupIds[1]);
    const previousMatchup =
      prevLeft && prevRight ? { left: prevLeft, right: prevRight } : null;
    const nextMatchup = generateMatchup(allColleges, previousMatchup ?? undefined);

    return { success: true, nextMatchup, voteCount: newVoteCount };
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

    return { nextMatchup: generateMatchup(allColleges, previousMatchup ?? undefined) };
  } catch (err) {
    console.error("Skip error:", err);
    return { nextMatchup: null };
  }
}

export async function getInitialMatchup(
  topicSlug: string = DEFAULT_TOPIC_SLUG
): Promise<Matchup | null> {
  const topicId = await getTopicId(topicSlug);
  if (!topicId) return null;

  const colleges = await fetchCollegesForTopic(topicId);
  if (colleges.length < 2) return null;

  return generateMatchup(colleges);
}
