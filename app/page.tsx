import { getInitialMatchup, LEADERBOARD_VOTE_THRESHOLD } from "@/app/actions/vote";
import MatchupVoting from "@/components/MatchupVoting";
import Link from "next/link";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get("cr_session")?.value;
  if (existing) return existing;
  return crypto.randomUUID();
}

export default async function Home() {
  const cookieStore = await cookies();
  const voteCount = parseInt(cookieStore.get("cr_votes")?.value ?? "0", 10);
  const leaderboardUnlocked = voteCount >= LEADERBOARD_VOTE_THRESHOLD;

  const [matchup, sessionId] = await Promise.all([
    getInitialMatchup(),
    getOrCreateSessionId(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              CollegeRank
            </span>
            <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-600 hidden sm:inline">
              ELO-powered college rankings
            </span>
          </div>
          {leaderboardUnlocked ? (
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Rankings
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed select-none">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Rankings
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-3xl">
          {/* Tagline */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Which college is better?
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Click a card to vote. ELO updates instantly after each matchup.
            </p>
          </div>

          {matchup ? (
            <MatchupVoting initialMatchup={matchup} sessionId={sessionId} initialVoteCount={voteCount} />
          ) : (
            <div className="text-center py-16 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                No colleges found. Please seed the database first.
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                Run the SQL in <code className="font-mono">supabase/seed.sql</code>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600">
          <span>CollegeRank &copy; {new Date().getFullYear()}</span>
          {leaderboardUnlocked ? (
            <Link href="/leaderboard" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
              View full rankings →
            </Link>
          ) : (
            <span>Rankings unlock after {LEADERBOARD_VOTE_THRESHOLD} votes</span>
          )}
        </div>
      </footer>
    </div>
  );
}
