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
  pinnedCount?: number;
  disabled?: boolean;
}

export default function TopicSelector({
  topics,
  selectedSlug,
  onSelect,
  pinnedCount = 5,
  disabled = false,
}: TopicSelectorProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pinned = topics.slice(0, pinnedCount);
  const overflow = topics.slice(pinnedCount);
  const overflowSelected = overflow.find(t => t.slug === selectedSlug);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {pinned.map(topic => (
        <button
          key={topic.slug}
          onClick={() => !disabled && onSelect(topic.slug)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedSlug === topic.slug
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          {topic.name}
        </button>
      ))}

      {overflow.length > 0 && (
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => !disabled && setOpen(o => !o)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
              overflowSelected
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {overflowSelected ? overflowSelected.name : "More"}
            <svg
              className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-30 min-w-[180px] py-1 overflow-hidden">
              {overflow.map(topic => (
                <button
                  key={topic.slug}
                  onClick={() => {
                    onSelect(topic.slug);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedSlug === topic.slug
                      ? "bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
