"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Matchup } from "@/types";
import { submitVote } from "@/app/actions/vote";
import CollegeCard from "./CollegeCard";

interface MatchupVotingProps {
  initialMatchup: Matchup;
  sessionId: string;
}

type VoteState = "idle" | "voting" | "animating";

export default function MatchupVoting({ initialMatchup, sessionId }: MatchupVotingProps) {
  const [matchup, setMatchup] = useState<Matchup>(initialMatchup);
  const [voteState, setVoteState] = useState<VoteState>("idle");
  const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

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
      {/* Vote counter */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {totalVotes > 0 ? (
            <>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {totalVotes}
              </span>{" "}
              vote{totalVotes !== 1 ? "s" : ""} this session
            </>
          ) : (
            "Which college is better?"
          )}
        </span>
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
