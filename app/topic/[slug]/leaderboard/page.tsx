import { createClient } from "@/lib/supabase-server";
import LeaderboardTable, { RankedEntry } from "@/components/LeaderboardTable";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { College } from "@/types";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("name")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!topic) return { title: "Rankings — Duelist" };
  return {
    title: `${topic.name} Rankings — Duelist`,
    description: `Community ELO rankings for "${topic.name}" on Duelist.`,
  };
}

export default async function TopicLeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug, name, is_system, is_public, leaderboard_unlock_votes, topic_group")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!topic) notFound();

  const cookieStore = await cookies();
  const voteCount = parseInt(cookieStore.get(`cr_votes_${slug}`)?.value ?? "0", 10);
  if (voteCount < topic.leaderboard_unlock_votes) {
    redirect(`/topic/${slug}`);
  }

  // Rankings source and tab list both depend on whether this is a system or user forum
  let items: RankedEntry[] = [];
  let error: unknown = null;

  if (topic.is_system) {
    const { data: ratingsData, error: ratingsError } = await supabase
      .from("elo_ratings")
      .select(`rating, wins, losses, matches_played, colleges(*)`)
      .eq("topic_id", topic.id)
      .order("rating", { ascending: false });
    error = ratingsError;
    items = ratingsData
      ? ratingsData.map(r => {
          const college = r.colleges as unknown as College;
          return {
            id: college.id,
            name: college.name,
            slug: college.slug,
            logo_url: college.logo_url,
            elo_rating: r.rating,
            wins: r.wins,
            comparisons: r.matches_played,
            // colleges.skips is a global counter across all topics.
            // Only use it for Overall where it's meaningful; zero it for sub-topics.
            skips: slug === "overall" ? (college.skips ?? 0) : 0,
          };
        })
      : [];
  } else {
    const { data: itemsData, error: itemsError } = await supabase
      .from("topic_items")
      .select("id, name, slug, image_url, elo_rating, wins, comparisons, skips")
      .eq("topic_id", topic.id)
      .order("elo_rating", { ascending: false });
    error = itemsError;
    items = itemsData
      ? itemsData.map(i => ({
          id: i.id,
          name: i.name,
          slug: i.slug,
          image_url: i.image_url,
          elo_rating: i.elo_rating,
          wins: i.wins,
          comparisons: i.comparisons,
          skips: i.skips ?? 0,
        }))
      : [];
  }

  const { count: globalVoteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true });

  // Only certain topic_groups get sibling tabs (subtopics).
  // Groups like "kalshi" are just homepage categories, not subtopic families.
  const SUBTOPIC_GROUPS = ["college-rankings", "coachella-2026"];
  const hasGroup = !!topic.topic_group && SUBTOPIC_GROUPS.includes(topic.topic_group);
  let topics: { slug: string; name: string }[];
  if (hasGroup) {
    const { data: groupTopics } = await supabase
      .from("topics")
      .select("slug, name")
      .eq("is_public", true)
      .eq("topic_group", topic.topic_group)
      .order("created_at", { ascending: true });
    topics = (groupTopics ?? []).map(t => ({ slug: t.slug, name: t.name }));
  } else {
    topics = [{ slug: topic.slug, name: topic.name }];
  }

  const totalVotes = Math.floor(items.reduce((sum, c) => sum + c.comparisons, 0) / 2);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight hover:opacity-80 transition-opacity"
          >
            Duelist
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={`/topic/${slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-medium text-white dark:text-zinc-900 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Vote
            </Link>
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {topic.name} Rankings
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {(globalVoteCount ?? 0).toLocaleString()}
              </span>{" "}
              votes on Duelist
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {totalVotes.toLocaleString()}
              </span>{" "}
              in this topic
            </span>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load rankings. Please check your database connection.
            </p>
          </div>
        ) : items.length > 0 ? (
          <LeaderboardTable
            items={items}
            topics={topics}
            currentTopicSlug={slug}
          />
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              No rankings yet. Vote to get the rankings started!
            </p>
            <Link
              href={`/topic/${slug}`}
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
          <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            Duelist
          </Link>
          <Link
            href={`/topic/${slug}`}
            className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
          >
            ← Back to voting
          </Link>
        </div>
      </footer>
    </div>
  );
}
