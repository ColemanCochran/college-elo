"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Matchup } from "@/types";
import { submitVote, submitSkip, getInitialMatchup } from "@/app/actions/vote";
import { LEADERBOARD_VOTE_THRESHOLD } from "@/lib/constants";
import { getTopicQuestion } from "@/lib/topics";
import CollegeCard from "./CollegeCard";
import TopicSelector from "./TopicSelector";

interface MatchupVotingProps {
  initialMatchup: Matchup;
  sessionId: string;
  initialVoteCount: number;
  initialTopicSlug: string;
  topics: { slug: string; name: string }[];
}

type VoteState = "idle" | "voting" | "animating";

export default function MatchupVoting({
  initialMatchup,
  sessionId,
  initialVoteCount,
  initialTopicSlug,
  topics,
}: MatchupVotingProps) {
  const router = useRouter();
  const [matchup, setMatchup] = useState<Matchup>(initialMatchup);
  const [topicSlug, setTopicSlug] = useState(initialTopicSlug);
  const [voteState, setVoteState] = useState<VoteState>("idle");
  const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [cumulativeVotes, setCumulativeVotes] = useState(initialVoteCount);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const leaderboardUnlocked = cumulativeVotes >= LEADERBOARD_VOTE_THRESHOLD;
  const remaining = Math.max(0, LEADERBOARD_VOTE_THRESHOLD - cumulativeVotes);
  const currentTopic = topics.find(t => t.slug === topicSlug) ?? topics[0];
  const heading = getTopicQuestion(topicSlug, currentTopic?.name ?? topicSlug);

  // Restore topic from localStorage on mount (only if URL has no explicit topic param)
  useEffect(() => {
    if (!window.location.search.includes("topic=")) {
      const saved = localStorage.getItem("cc_topic");
      if (saved && saved !== topicSlug && topics.some(t => t.slug === saved)) {
        handleTopicChange(saved);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopicChange = useCallback(
    async (slug: string) => {
      if (slug === topicSlug || submittingRef.current) return;
      submittingRef.current = true;
      setVoteState("animating");

      localStorage.setItem("cc_topic", slug);
      router.replace(`/?topic=${slug}`, { scroll: false });

      const newMatchup = await getInitialMatchup(slug);
      setTopicSlug(slug);
      if (newMatchup) setMatchup(newMatchup);
      setVoteState("idle");
      submittingRef.current = false;
    },
    [topicSlug, router]
  );

  const handleSkip = useCallback(async () => {
    if (voteState !== "idle" || submittingRef.current) return;
    submittingRef.current = true;
    setVoteState("voting");

    const result = await submitSkip(
      matchup.left.id,
      matchup.right.id,
      [matchup.left.id, matchup.right.id],
      topicSlug
    );

    setTimeout(() => {
      setVoteState("animating");
      setTimeout(() => {
        if (result.nextMatchup) setMatchup(result.nextMatchup);
        setVoteState("idle");
        submittingRef.current = false;
      }, 150);
    }, 200);
  }, [matchup, voteState, topicSlug]);

  const handleVote = useCallback(
    async (side: "left" | "right") => {
      if (voteState !== "idle" || submittingRef.current) return;
      submittingRef.current = true;
      setVoteState("voting");
      setSelectedSide(side);
      setError(null);

      const winner = side === "left" ? matchup.left : matchup.right;
      const loser = side === "left" ? matchup.right : matchup.left;

      const result = await submitVote(
        winner.id,
        loser.id,
        sessionId,
        [matchup.left.id, matchup.right.id],
        topicSlug
      );

      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        setVoteState("idle");
        setSelectedSide(null);
        submittingRef.current = false;
        return;
      }

      setTotalVotes(v => v + 1);
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
    [matchup, sessionId, voteState, topicSlug]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleVote("left");
      if (e.key === "ArrowRight") handleVote("right");
      if (e.key === "ArrowDown") { e.preventDefault(); handleSkip(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleVote, handleSkip]);

  const isDisabled = voteState !== "idle";

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
      {/* Topic selector + heading */}
      <div className="text-center flex flex-col gap-2">
        <TopicSelector
          topics={topics}
          selectedSlug={topicSlug}
          onSelect={handleTopicChange}
          disabled={isDisabled}
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Click a card to vote · ELO updates instantly after each matchup
        </p>
      </div>

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
        className={`grid grid-cols-2 gap-3 sm:gap-4 transition-opacity duration-150 ${
          voteState === "animating" ? "opacity-0" : "opacity-100"
        }`}
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
      <div className="flex items-center justify-center -mt-2 pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 tracking-widest">
          VS
        </span>
      </div>

      {/* Skip */}
      <div className="flex items-center justify-center -mt-1">
        <button
          onClick={handleSkip}
          disabled={isDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          Skip
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 hidden sm:block -mt-1">
        Use{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">←</kbd>
        {" "}/{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">→</kbd>
        {" "}to vote,{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">↓</kbd>
        {" "}to skip
      </p>

      {error && (
        <p className="text-center text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {totalVotes > 0 && (
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 -mt-2">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""} this session
        </p>
      )}
    </div>
  );
}
