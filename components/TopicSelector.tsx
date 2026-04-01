"use client";

import { useState, useEffect, useRef } from "react";

export interface TopicOption {
  slug: string;
  name: string;
}

interface TopicSelectorProps {
  topics: TopicOption[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  disabled?: boolean;
}

export default function TopicSelector({
  topics,
  selectedSlug,
  onSelect,
  disabled = false,
}: TopicSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = topics.find(t => t.slug === selectedSlug) ?? topics[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">
      <span className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg font-medium">
        I want to rank by
      </span>

      <div ref={ref} className="relative">
        <button
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {selected.name}
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-30 min-w-[200px] py-1 overflow-hidden">
            {topics.map(topic => (
              <button
                key={topic.slug}
                onClick={() => {
                  onSelect(topic.slug);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-3 ${
                  selectedSlug === topic.slug
                    ? "bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                {topic.name}
                {selectedSlug === topic.slug && (
                  <svg className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
