"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTopic } from "@/app/actions/topics";

interface Props {
  topic: { id: string; name: string; description: string | null; slug: string };
  initialItems: string[];
}

export default function EditForumForm({ topic, initialItems }: Props) {
  const router = useRouter();
  const [name, setName] = useState(topic.name);
  const [description, setDescription] = useState(topic.description ?? "");
  const [itemsText, setItemsText] = useState(initialItems.join("\n"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const items = itemsText.split("\n").map(s => s.trim()).filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Forum name is required."); return; }
    if (items.length < 3) { setError("Add at least 3 items."); return; }

    setLoading(true);
    const result = await updateTopic(topic.id, { name, description, items });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Forum name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={80}
          className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={200}
          className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
        />
      </div>

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
          rows={12}
          className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition resize-none font-mono"
        />
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          One item per line. New items start at 1500 ELO. Removed items lose their ranking data.
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
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/topic/${topic.slug}`)}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
