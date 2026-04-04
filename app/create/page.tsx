"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTopic } from "@/app/actions/topics";
import ThemeToggle from "@/components/ThemeToggle";

export default function CreateTopicPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const items = itemsText.split("\n").map(s => s.trim()).filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Forum name is required."); return; }
    if (items.length < 3) { setError("Add at least 3 items."); return; }

    setLoading(true);
    const result = await createTopic({ name, description, items });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success the server action redirects — no client-side handling needed
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
            Create a forum
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Define a list of items and let the community vote to rank them.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Forum name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Best Pizza Toppings"
              maxLength={80}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description of what you're ranking"
              maxLength={200}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
            />
          </div>

          {/* Items */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Items <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${items.length < 3 ? "text-zinc-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {items.length} item{items.length !== 1 ? "s" : ""}{items.length < 3 ? " (min 3)" : ""}
              </span>
            </div>
            <textarea
              value={itemsText}
              onChange={e => setItemsText(e.target.value)}
              placeholder={"Pepperoni\nMushrooms\nExtra Cheese\nOlives"}
              rows={10}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition resize-none font-mono"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              One item per line. Minimum 3 items.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-semibold text-white dark:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating…" : "Create forum"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-3xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 text-center">
          Duelist
        </div>
      </footer>
    </div>
  );
}
