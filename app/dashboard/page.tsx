import { createClient } from "@/lib/supabase-server";
import { getAdminSession, } from "@/lib/admin-auth";
import { signOut } from "@/app/actions/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Duelist",
};

export default async function DashboardPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/auth/sign-in");

  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, name, description, leaderboard_unlock_votes, created_at")
    .eq("is_system", false)
    .order("created_at", { ascending: false });

  const userTopics = topics ?? [];

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
          <form action={signOut}>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Forums
          </h1>
          <Link
            href="/create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-semibold text-white dark:text-zinc-900 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New forum
          </Link>
        </div>

        {userTopics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              No forums yet
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Create your first forum and share it for the community to vote on.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-semibold text-white dark:text-zinc-900 transition-colors"
            >
              Create a forum
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {userTopics.map(topic => (
              <div
                key={topic.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {topic.name}
                  </p>
                  {topic.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {topic.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/topic/${topic.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    Vote
                  </Link>
                  <Link
                    href={`/topic/${topic.slug}/leaderboard`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    Rankings
                  </Link>
                  <Link
                    href={`/topic/${topic.slug}/edit`}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-3xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 flex items-center justify-between">
          <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            Duelist
          </Link>
          <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            Browse forums
          </Link>
        </div>
      </footer>
    </div>
  );
}
