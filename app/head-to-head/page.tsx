import { createClient } from "@/lib/supabase-server";
import { getHeadToHead, getTopMatchups } from "@/app/actions/matchup";
import HeadToHeadLookup from "@/components/HeadToHeadLookup";
import Link from "next/link";

export const revalidate = 60;

export const metadata = {
  title: "Head to Head — Duelist",
  description: "See how any two colleges match up based on community votes.",
};

export default async function HeadToHeadPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a: idA, b: idB } = await searchParams;

  const supabase = await createClient();
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, slug, elo_rating, comparisons, wins, losses, skips, logo_url, created_at, updated_at")
    .order("name", { ascending: true });

  const [stat, topMatchups] = await Promise.all([
    idA && idB ? getHeadToHead(idA, idB) : Promise.resolve(null),
    getTopMatchups(25),
  ]);

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
              href="/leaderboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Rankings
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Head to Head
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Cross-yield data — how two schools perform when shown together
          </p>
        </div>

        {colleges && colleges.length > 0 ? (
          <HeadToHeadLookup
            colleges={colleges as any}
            selectedAId={idA ?? null}
            selectedBId={idB ?? null}
            stat={stat}
            topMatchups={topMatchups}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No colleges found.</p>
        )}
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-4xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 flex items-center justify-between">
          <span>Duelist</span>
          <span>Refreshes every 60 seconds</span>
        </div>
      </footer>
    </div>
  );
}
