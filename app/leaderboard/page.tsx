import { createClient } from "@/lib/supabase-server";
import LeaderboardTable from "@/components/LeaderboardTable";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LEADERBOARD_VOTE_THRESHOLD } from "@/lib/constants";
import { TOPICS, DEFAULT_TOPIC_SLUG, isValidTopicSlug } from "@/lib/topics";
import { College } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rankings — College Clash",
  description: "Community-voted ELO rankings for the top 50 U.S. colleges.",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const cookieStore = await cookies();
  const voteCount = parseInt(cookieStore.get("cr_votes")?.value ?? "0", 10);
  if (voteCount < LEADERBOARD_VOTE_THRESHOLD) redirect("/");

  const { topic: rawTopic } = await searchParams;
  const topicSlug =
    rawTopic && isValidTopicSlug(rawTopic) ? rawTopic : DEFAULT_TOPIC_SLUG;

  const supabase = await createClient();

  const { data: topicRow } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", topicSlug)
    .single();

  const { data: ratingsData, error } = topicRow
    ? await supabase
        .from("elo_ratings")
        .select(`rating, wins, losses, matches_played, colleges(*)`)
        .eq("topic_id", topicRow.id)
        .order("rating", { ascending: false })
    : { data: null, error: new Error("Topic not found") };

  const colleges: College[] = ratingsData
    ? ratingsData.map(r => ({
        ...(r.colleges as unknown as College),
        elo_rating: r.rating,
        wins: r.wins,
        losses: r.losses,
        comparisons: r.matches_played,
        // Skips are global (not per-topic), so only show them on Overall
        // to avoid inflated skip% on topics that have no votes yet
        skips: topicSlug === "overall" ? ((r.colleges as unknown as College).skips ?? 0) : 0,
      }))
    : [];

  const totalVotes = Math.floor(
    colleges.reduce((sum, c) => sum + c.comparisons, 0) / 2
  );

  const topics = TOPICS.map(t => ({ slug: t.slug, name: t.name }));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight hover:opacity-80 transition-opacity"
          >
            College Clash
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-medium text-white dark:text-zinc-900 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Vote
            </Link>
            <Link
              href="/head-to-head"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Head to Head
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            College Rankings
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Community-voted ELO rankings &middot;{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {totalVotes.toLocaleString()} votes in this category
            </span>
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load rankings. Please check your database connection.
            </p>
          </div>
        ) : colleges.length > 0 ? (
          <LeaderboardTable
            colleges={colleges}
            topics={topics}
            currentTopicSlug={topicSlug}
          />
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              No data yet for this topic. Vote to get the rankings started!
            </p>
            <Link
              href={`/?topic=${topicSlug}`}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              Start voting
            </Link>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/about" className="text-sm text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            How do ELO rankings work? →
          </Link>
        </div>
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-4xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 flex items-center justify-between">
          <span>College Clash &copy; {new Date().getFullYear()}</span>
          <span>Live rankings</span>
        </div>
      </footer>
    </div>
  );
}
