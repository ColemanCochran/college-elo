"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Matchup } from "@/types";
import { submitVote, LEADERBOARD_VOTE_THRESHOLD } from "@/app/actions/vote";
import CollegeCard from "./CollegeCard";

interface MatchupVotingProps {
  initialMatchup: Matchup;
  sessionId: string;
  initialVoteCount: number;
}

type VoteState = "idle" | "voting" | "animating";

export default function MatchupVoting({ initialMatchup, sessionId, initialVoteCount }: MatchupVotingProps) {
  const [matchup, setMatchup] = useState<Matchup>(initialMatchup);
  const [voteState, setVoteState] = useState<VoteState>("idle");
  const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [cumulativeVotes, setCumulativeVotes] = useState(initialVoteCount);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const leaderboardUnlocked = cumulativeVotes >= LEADERBOARD_VOTE_THRESHOLD;
  const remaining = Math.max(0, LEADERBOARD_VOTE_THRESHOLD - cumulativeVotes);

  const handleVote = useCallback(
    async (side: "left" | "right") => {
      if (voteState !== "idle" || submittingRef.current) return;
      submittingRef.current = true;
      setVoteState("voting");
      setSelectedSide(side);
      setError(null);

      const winner = side === "left" ? matchup.left : matchup.right;
      const loser = side === "left" ? matchup.right : matchup.left;

      const result = await submitVote(winner.id, loser.id, sessionId, [
        matchup.left.id,
        matchup.right.id,
      ]);

      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        setVoteState("idle");
        setSelectedSide(null);
        submittingRef.current = false;
        return;
      }

      setTotalVotes((v) => v + 1);
      if (result.voteCount !== undefined) setCumulativeVotes(result.voteCount);

      setTimeout(() => {
        setVoteState("animating");
        setTimeout(() => {
          if (result.nextMatchup) setMatchup(result.nextMatchup);
          setSelectedSide(null);
          setVoteState("idle");
          submittingRef.current = false;
        }, 150);
      }, 300);
    },
    [matchup, sessionId, voteState]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleVote("left");
      if (e.key === "ArrowRight") handleVote("right");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleVote]);

  const isDisabled = voteState !== "idle";

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Leaderboard unlock progress / unlocked CTA */}
      <div className="flex flex-col items-center gap-2">
        {leaderboardUnlocked ? (
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-medium text-white dark:text-zinc-900 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Rankings
          </Link>
        ) : (
          <div className="w-full max-w-xs flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-between w-full text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Rankings locked
              </span>
              <span>{cumulativeVotes} / {LEADERBOARD_VOTE_THRESHOLD} votes</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-400 dark:bg-zinc-500 transition-all duration-300"
                style={{ width: `${(cumulativeVotes / LEADERBOARD_VOTE_THRESHOLD) * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              {remaining} more vote{remaining !== 1 ? "s" : ""} to unlock
            </p>
          </div>
        )}
      </div>

      {/* Cards */}
      <div
        className={`
          grid grid-cols-2 gap-3 sm:gap-4
          transition-opacity duration-150
          ${voteState === "animating" ? "opacity-0" : "opacity-100"}
        `}
      >
        <CollegeCard
          college={matchup.left}
          side="left"
          onSelect={() => handleVote("left")}
          disabled={isDisabled}
          selected={selectedSide === "left"}
          lost={selectedSide === "right"}
        />
        <CollegeCard
          college={matchup.right}
          side="right"
          onSelect={() => handleVote("right")}
          disabled={isDisabled}
          selected={selectedSide === "right"}
          lost={selectedSide === "left"}
        />
      </div>

      {/* VS divider */}
      <div className="relative -mt-2 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 tracking-widest">
            VS
          </span>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 hidden sm:block -mt-2">
        Use{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">←</kbd>
        {" "}/{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">→</kbd>
        {" "}to vote with keyboard
      </p>

      {error && (
        <p className="text-center text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
