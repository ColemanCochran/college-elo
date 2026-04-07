"use client";

import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  initialVisible?: number;
  children: React.ReactNode[];
}

export default function CollapsibleSection({
  title,
  count,
  initialVisible = 4,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? children : children.slice(0, initialVisible);
  const hasMore = children.length > initialVisible;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
          {title}
          <span className="ml-1.5 text-zinc-300 dark:text-zinc-700">{count}</span>
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          {expanded ? "Show less" : `Show all ${children.length}`}
        </button>
      )}
    </div>
  );
}
