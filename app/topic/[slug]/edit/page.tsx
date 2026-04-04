import { createClient } from "@/lib/supabase-server";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import EditForumForm from "@/components/EditForumForm";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("name")
    .eq("slug", slug)
    .single();
  return { title: topic ? `Edit "${topic.name}" — Duelist` : "Edit Forum — Duelist" };
}

export default async function EditForumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [supabase, isAdmin] = await Promise.all([createClient(), getAdminSession()]);

  if (!isAdmin) redirect(`/auth/sign-in`);

  const { data: topic } = await supabase
    .from("topics")
    .select("id, name, slug, description, is_system")
    .eq("slug", slug)
    .single();

  if (!topic || topic.is_system) notFound();

  const { data: itemRows } = await supabase
    .from("topic_items")
    .select("name, elo_rating")
    .eq("topic_id", topic.id)
    .order("elo_rating", { ascending: false });

  const initialItems = (itemRows ?? []).map(i => i.name);

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
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-10 sm:py-14">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
            Edit forum
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Update the name, description, or item list.
          </p>
        </div>

        <EditForumForm
          topic={{ id: topic.id, name: topic.name, description: topic.description ?? null, slug: topic.slug }}
          initialItems={initialItems}
        />
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-3xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 text-center">
          Duelist
        </div>
      </footer>
    </div>
  );
}
