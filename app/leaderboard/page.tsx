import { createClient } from "@/lib/supabase-server";
import LeaderboardTable from "@/components/LeaderboardTable";
import EloExplainer from "@/components/EloExplainer";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LEADERBOARD_VOTE_THRESHOLD } from "@/lib/constants";

// Revalidate every 60 seconds for near-real-time freshness
export const revalidate = 60;

export const metadata = {
  title: "Rankings — CollegeRank",
  description: "Community-voted ELO rankings for the top 50 U.S. colleges.",
};

export default async function LeaderboardPage() {
  const cookieStore = await cookies();
  const voteCount = parseInt(cookieStore.get("cr_votes")?.value ?? "0", 10);
  if (voteCount < LEADERBOARD_VOTE_THRESHOLD) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: colleges, error } = await supabase
    .from("colleges")
    .select("*")
    .order("elo_rating", { ascending: false });

  const totalVotes = colleges
    ? Math.floor(colleges.reduce((sum, c) => sum + c.comparisons, 0) / 2)
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight hover:opacity-80 transition-opacity"
          >
            CollegeRank
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-medium text-white dark:text-zinc-900 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            Vote
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            College Rankings
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Community-voted ELO rankings &middot;{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {totalVotes.toLocaleString()} total votes
            </span>
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load rankings. Please check your database connection.
            </p>
          </div>
        ) : colleges && colleges.length > 0 ? (
          <LeaderboardTable colleges={colleges} />
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              No colleges yet. Seed the database to get started.
            </p>
          </div>
        )}

        <EloExplainer />
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-4xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 flex items-center justify-between">
          <span>CollegeRank &copy; {new Date().getFullYear()}</span>
          <span>Refreshes every 60 seconds</span>
        </div>
      </footer>
    </div>
  );
}
