import { getInitialMatchup } from "@/app/actions/vote";
import { createClient, getUser } from "@/lib/supabase-server";
import MatchupVoting from "@/components/MatchupVoting";
import ShareButton from "@/components/ShareButton";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import crypto from "crypto";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get("cr_session")?.value;
  if (existing) return existing;
  const newId = crypto.randomUUID();
  try {
    cookieStore.set("cr_session", newId, {
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  } catch {
    // Server Component render pass — cookie will be set on next response
  }
  return newId;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!topic) return { title: "Duelist" };
  return {
    title: `${topic.name} — Duelist`,
    description: topic.description ?? `Vote to rank items in "${topic.name}" on Duelist.`,
  };
}

export default async function TopicVotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const user = await getUser();

  // Fetch topic including creator-controlled threshold
  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug, name, description, is_public, is_system, leaderboard_unlock_votes, owner_id, topic_group")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!topic) notFound();

  const cookieStore = await cookies();
  const voteCount = parseInt(
    cookieStore.get(`cr_votes_${slug}`)?.value ?? "0",
    10
  );
  const leaderboardUnlocked = voteCount >= topic.leaderboard_unlock_votes;

  const [matchup, sessionId] = await Promise.all([
    getInitialMatchup(slug),
    getOrCreateSessionId(),
  ]);

  // Only certain topic_groups get a shared selector (subtopics).
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight hover:opacity-80 transition-opacity"
          >
            Duelist
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {leaderboardUnlocked ? (
              <Link
                href={`/topic/${slug}/leaderboard`}
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
            {!topic.is_system && (
              <ShareButton slug={slug} forumName={topic.name} />
            )}
            {!topic.is_system && user?.id === topic.owner_id && (
              <Link
                href={`/topic/${slug}/edit`}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Edit
              </Link>
            )}
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-3xl">
          {matchup ? (
            <MatchupVoting
              initialMatchup={matchup}
              sessionId={sessionId}
              initialVoteCount={voteCount}
              initialTopicSlug={slug}
              topics={topics}
              threshold={topic.leaderboard_unlock_votes}
              isSystem={hasGroup}
              description={topic.description}
            />
          ) : (
            <div className="text-center py-16 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                No items found for this topic.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600">
          <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            Duelist
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
              About
            </Link>
            {leaderboardUnlocked ? (
              <Link href={`/topic/${slug}/leaderboard`} className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                View rankings →
              </Link>
            ) : (
              <span>Rankings unlock after {topic.leaderboard_unlock_votes} votes</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
