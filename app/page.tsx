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
    .select("slug, name, description, is_system, leaderboard_unlock_votes")
    .eq("is_public", true)
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true });

  const topics: TopicCardData[] = (allTopics ?? []).map(t => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    is_system: t.is_system,
    leaderboard_unlock_votes: t.leaderboard_unlock_votes,
  }));

  const systemTopics = topics.filter(t => t.is_system);
  const userTopics = topics.filter(t => !t.is_system);

  const subtopicNames = systemTopics.map(t => t.name);

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
            {/* College Rankings — single card grouping all system topics */}
            {systemTopics.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-3">
                  Featured
                </p>
                <TopicCard
                  topic={{
                    slug: "overall",
                    name: "College Rankings",
                    description: null,
                    is_system: true,
                    leaderboard_unlock_votes: 10,
                  }}
                  featured
                  subtopics={subtopicNames}
                />
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
