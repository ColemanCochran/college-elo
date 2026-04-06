import { createClient } from "@/lib/supabase-server";
import { getAdminSession } from "@/lib/admin-auth";
import TopicCard, { TopicCardData } from "@/components/TopicCard";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Duelist — Community ELO Rankings",
  description: "Vote head-to-head and rank anything. Community-powered ELO ratings updated in real time.",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;

  // Legacy URL compatibility: /?topic=X → /topic/X
  if (topic) {
    redirect(`/topic/${topic}`);
  }

  const [supabase, isAdmin] = await Promise.all([createClient(), getAdminSession()]);
  const { data: allTopics } = await supabase
    .from("topics")
    .select("slug, name, description, is_system, leaderboard_unlock_votes, topic_group")
    .eq("is_public", true)
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true });

  const topics: TopicCardData[] = (allTopics ?? []).map(t => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    is_system: t.is_system,
    leaderboard_unlock_votes: t.leaderboard_unlock_votes,
    topic_group: t.topic_group ?? null,
  }));

  // Topics with a topic_group are "featured" (shown as grouped cards).
  // Everything else is a standalone community forum.
  const userTopics = topics.filter(t => !t.topic_group);

  // Group featured topics by topic_group for separate featured cards
  const groupedTopics = new Map<string, TopicCardData[]>();
  for (const t of topics.filter(t => t.topic_group)) {
    const group = t.topic_group!;
    if (!groupedTopics.has(group)) groupedTopics.set(group, []);
    groupedTopics.get(group)!.push(t);
  }

  // Display config for each group: card title, link slug, description.
  // Order array controls display order on the homepage (first = top).
  const FEATURED_ORDER = ["coachella-2026", "college-rankings"];
  const GROUP_META: Record<string, { title: string; slug: string; description: string | null }> = {
    "coachella-2026": { title: "2026 Coachella Lineup", slug: "coachella-2026", description: "Rank every artist on the Coachella 2026 lineup." },
    "college-rankings": { title: "College Rankings", slug: "overall", description: null },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Duelist
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              About
            </Link>
            {isAdmin ? (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-medium text-white dark:text-zinc-900 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/waitlist"
                className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-medium text-white dark:text-zinc-900 transition-colors"
              >
                Join waitlist
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 sm:py-14">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
            Vote to rank anything.
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Pick a topic below and start voting head-to-head. ELO rankings update instantly after every matchup.
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">No forums yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Featured topic groups */}
            {groupedTopics.size > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-3">
                  Featured
                </p>
                <div className="flex flex-col gap-3">
                  {FEATURED_ORDER.filter(g => groupedTopics.has(g)).map(group => {
                    const groupTopics = groupedTopics.get(group)!;
                    const meta = GROUP_META[group] ?? {
                      title: groupTopics[0]?.name ?? group,
                      slug: groupTopics[0]?.slug ?? group,
                      description: null,
                    };
                    return (
                      <TopicCard
                        key={group}
                        topic={{
                          slug: meta.slug,
                          name: meta.title,
                          description: meta.description,
                          is_system: true,
                          leaderboard_unlock_votes: 10,
                          topic_group: group,
                        }}
                        featured
                        subtopics={groupTopics.map(t => t.name)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* User-created topics */}
            {userTopics.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-3">
                  Community forums
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {userTopics.map(t => (
                    <TopicCard key={t.slug} topic={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-3xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 flex items-center justify-between">
          <span>Duelist</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
              About
            </Link>
            <a
              href="https://coleman.business/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              Donate
            </a>
            {!isAdmin && (
              <Link href="/auth/sign-in" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
