"use server";

import { createClient, createAdminClient } from "@/lib/supabase-server";
import { calculateNewRatings } from "@/lib/elo";
import { generateMatchup } from "@/lib/matchmaking";
import { VoteResult, Matchup } from "@/types";
import { headers, cookies } from "next/headers";
import crypto from "crypto";
import { LEADERBOARD_VOTE_THRESHOLD } from "@/lib/constants";

const RATE_LIMIT_MS = 500; // minimum ms between votes per IP

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "cr_salt_2024").digest("hex").slice(0, 32);
}

export async function submitVote(
  winnerId: string,
  loserId: string,
  sessionId: string,
  previousMatchupIds: [string, string]
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

    // DB-level rate limit: check for a recent vote from this IP in the last RATE_LIMIT_MS
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

    // Fetch both colleges (read — anon client is fine)
    const { data: colleges, error: fetchError } = await supabase
      .from("colleges")
      .select("*")
      .in("id", [winnerId, loserId]);

    if (fetchError || !colleges || colleges.length !== 2) {
      return { success: false, nextMatchup: null, error: "Colleges not found." };
    }

    const winner = colleges.find((c) => c.id === winnerId)!;
    const loser = colleges.find((c) => c.id === loserId)!;

    const { winnerNew, loserNew } = calculateNewRatings(
      winner.elo_rating,
      loser.elo_rating
    );

    // Update winner (admin — bypasses RLS)
    const { error: winnerError } = await admin
      .from("colleges")
      .update({
        elo_rating: winnerNew,
        comparisons: winner.comparisons + 1,
        wins: winner.wins + 1,
      })
      .eq("id", winnerId);

    if (winnerError) throw winnerError;

    // Update loser (admin — bypasses RLS)
    const { error: loserError } = await admin
      .from("colleges")
      .update({
        elo_rating: loserNew,
        comparisons: loser.comparisons + 1,
        losses: loser.losses + 1,
      })
      .eq("id", loserId);

    if (loserError) throw loserError;

    // Insert vote record (admin — bypasses RLS)
    await admin.from("votes").insert({
      winner_college_id: winnerId,
      loser_college_id: loserId,
      ip_hash: ipHash,
      session_id: sessionId,
    });

    // Record head-to-head outcome atomically
    const [canonA, canonB] = winnerId < loserId ? [winnerId, loserId] : [loserId, winnerId];
    await admin.rpc("record_matchup_vote", {
      p_college_a_id: canonA,
      p_college_b_id: canonB,
      p_winner_id: winnerId,
    });

    // Increment the persistent vote counter cookie
    const cookieStore = await cookies();
    const currentCount = parseInt(cookieStore.get("cr_votes")?.value ?? "0", 10);
    const newVoteCount = currentCount + 1;
    cookieStore.set("cr_votes", String(newVoteCount), {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    // Fetch all colleges for next matchup (fresh data)
    const { data: allColleges, error: allError } = await supabase
      .from("colleges")
      .select("*")
      .order("comparisons", { ascending: true });

    if (allError || !allColleges) {
      return { success: true, nextMatchup: null };
    }

    const previousMatchup: Matchup = {
      left: colleges.find((c) => c.id === previousMatchupIds[0]) ?? winner,
      right: colleges.find((c) => c.id === previousMatchupIds[1]) ?? loser,
    };

    const nextMatchup = generateMatchup(allColleges, previousMatchup);

    return { success: true, nextMatchup, voteCount: newVoteCount };
  } catch (err) {
    console.error("Vote error:", err);
    return { success: false, nextMatchup: null, error: "Something went wrong." };
  }
}

export async function submitSkip(
  leftId: string,
  rightId: string,
  previousMatchupIds: [string, string]
): Promise<{ nextMatchup: Matchup | null }> {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: colleges } = await supabase
      .from("colleges")
      .select("*")
      .in("id", [leftId, rightId]);

    if (!colleges || colleges.length !== 2) return { nextMatchup: null };

    // Apply -1 ELO nudge and increment skip counter for both schools
    for (const college of colleges) {
      await admin
        .from("colleges")
        .update({
          elo_rating: Math.max(1000, college.elo_rating - 1),
          skips: college.skips + 1,
        })
        .eq("id", college.id);
    }

    // Record head-to-head skip atomically
    const [canonA, canonB] = leftId < rightId ? [leftId, rightId] : [rightId, leftId];
    await admin.rpc("record_matchup_skip", {
      p_college_a_id: canonA,
      p_college_b_id: canonB,
    });

    const { data: allColleges } = await supabase
      .from("colleges")
      .select("*")
      .order("comparisons", { ascending: true });

    if (!allColleges) return { nextMatchup: null };

    const previousMatchup: Matchup = {
      left: colleges.find((c) => c.id === previousMatchupIds[0]) ?? colleges[0],
      right: colleges.find((c) => c.id === previousMatchupIds[1]) ?? colleges[1],
    };

    return { nextMatchup: generateMatchup(allColleges, previousMatchup) };
  } catch (err) {
    console.error("Skip error:", err);
    return { nextMatchup: null };
  }
}

export async function getInitialMatchup(): Promise<Matchup | null> {
  const supabase = await createClient();

  const { data: colleges, error } = await supabase
    .from("colleges")
    .select("*")
    .order("comparisons", { ascending: true });

  if (error || !colleges || colleges.length < 2) return null;

  return generateMatchup(colleges);
}
