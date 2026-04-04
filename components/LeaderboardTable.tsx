"use client";

import { useState, useMemo } from "react";
import { getFlag } from "@/lib/flags";

const LOGO_MAP: Record<string, string> = {
  harvard: "/logos/harvard.png",
  stanford: "/logos/stanford.png",
  mit: "/logos/mit.png",
  princeton: "/logos/princeton.png",
  yale: "/logos/yale.png",
  columbia: "/logos/columbia.png",
  uchicago: "/logos/uchicago.png",
  upenn: "/logos/upenn.png",
  duke: "/logos/duke.png",
  northwestern: "/logos/northwestern.png",
  "johns-hopkins": "/logos/johns-hopkins.png",
  dartmouth: "/logos/dartmouth.png",
  brown: "/logos/brown.png",
  cornell: "/logos/cornell.png",
  rice: "/logos/rice.png",
  vanderbilt: "/logos/vanderbilt.png",
  "notre-dame": "/logos/notre-dame.png",
  georgetown: "/logos/georgetown.png",
  emory: "/logos/emory.png",
  tufts: "/logos/tufts.png",
  cmu: "/logos/cmu.png",
  "uc-berkeley": "/logos/uc-berkeley.png",
  ucla: "/logos/ucla.png",
  umich: "/logos/umich.png",
  uva: "/logos/uva.png",
  unc: "/logos/unc.png",
  usc: "/logos/usc.png",
  "uc-davis": "/logos/uc-davis.png",
  "ut-austin": "/logos/ut-austin.png",
  gatech: "/logos/gatech.png",
  "uw-madison": "/logos/uw-madison.png",
  uiuc: "/logos/uiuc.png",
  purdue: "/logos/purdue.png",
  "penn-state": "/logos/penn-state.png",
  "ohio-state": "/logos/ohio-state.png",
  "uw-seattle": "/logos/uw-seattle.png",
  bu: "/logos/bu.png",
  northeastern: "/logos/northeastern.png",
  tulane: "/logos/tulane.png",
  "case-western": "/logos/case-western.png",
  rochester: "/logos/rochester.png",
  "wake-forest": "/logos/wake-forest.png",
  rpi: "/logos/rpi.png",
  uf: "/logos/uf.png",
  uga: "/logos/uga.png",
  indiana: "/logos/indiana.png",
  umn: "/logos/umn.png",
  caltech: "/logos/caltech.png",
  nyu: "/logos/nyu.png",
  washu: "/logos/washu.png",
  ucsc: "/logos/ucsc.png",
  amherst: "/logos/amherst.png",
  "harvey-mudd": "/logos/harvey-mudd.png",
  williams: "/logos/williams.png",
  pomona: "/logos/pomona.png",
  uci: "/logos/uci.png",
  ucsb: "/logos/ucsb.png",
  umd: "/logos/umd.png",
  "william-and-mary": "/logos/william-and-mary.png",
  "boston-college": "/logos/boston-college.png",
  baylor: "/logos/baylor.png",
  bowdoin: "/logos/bowdoin.png",
  "claremont-mckenna": "/logos/claremont-mckenna.png",
  "texas-am": "/logos/texas-am.png",
  "cu-boulder": "/logos/cu-boulder.png",
  "colorado-mines": "/logos/colorado-mines.png",
  ucsd: "/logos/ucsd.png",
};

function EntryLogo({ slug, name, logo_url, image_url }: { slug: string; name: string; logo_url?: string | null; image_url?: string | null }) {
  const [error, setError] = useState(false);
  const url = LOGO_MAP[slug] ?? logo_url ?? image_url ?? null;
  const flag = getFlag(slug);
  if (flag) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-100 dark:border-zinc-700">
        <span className="text-lg leading-none">{flag}</span>
      </div>
    );
  }
  if (!url || error) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="w-8 h-8 rounded-full object-contain bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex-shrink-0"
      onError={() => setError(true)}
    />
  );
}
import { useRouter } from "next/navigation";
import { SortField } from "@/types";
import { calcWinRate } from "@/lib/elo";

/** Minimum shape required to render a leaderboard row. */
export interface RankedEntry {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  logo_url?: string | null;
  elo_rating: number;
  comparisons: number;
  wins: number;
  skips?: number;
}

interface TopicOption {
  slug: string;
  name: string;
}

interface LeaderboardTableProps {
  items: RankedEntry[];
  topics: TopicOption[];
  currentTopicSlug: string;
}


export default function LeaderboardTable({ items, topics, currentTopicSlug }: LeaderboardTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("elo_rating");
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    let list = items.map((item) => {
      const appearances = item.comparisons + (item.skips ?? 0);
      return {
        ...item,
        win_rate: calcWinRate(item.wins, item.comparisons),
        skip_rate: appearances > 0 ? Math.round((item.skips ?? 0) / appearances * 100) : 0,
      };
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortField === "elo_rating") return b.elo_rating - a.elo_rating;
      if (sortField === "comparisons") return b.comparisons - a.comparisons;
      if (sortField === "win_rate") return b.win_rate - a.win_rate;
      if (sortField === "skip_rate") return b.skip_rate - a.skip_rate;
      return 0;
    });

    return list;
  }, [items, sortField, search]);

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => setSortField(field)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        sortField === field
          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Topic tabs — navigate to /topic/[slug]/leaderboard */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {topics.map(topic => (
          <button
            key={topic.slug}
            onClick={() => router.push(`/topic/${topic.slug}/leaderboard`)}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              currentTopicSlug === topic.slug
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {topic.name}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">Sort by:</span>
          <SortButton field="elo_rating" label="ELO" />
          <SortButton field="comparisons" label="Votes" />
          <SortButton field="win_rate" label="Win %" />
          <SortButton field="skip_rate" label="Skip %" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 sticky top-0">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 w-12">#</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 font-mono">ELO</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Votes</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Win %</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">Skip %</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, index) => {
                const isTop10 = index < 10 && !search && sortField === "elo_rating";
                return (
                  <tr
                    key={entry.id}
                    className={`
                      border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 transition-colors
                      ${isTop10
                        ? "bg-amber-50/40 dark:bg-amber-900/10 hover:bg-amber-50/70 dark:hover:bg-amber-900/20"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      }
                    `}
                  >
                    <td className="px-4 py-3 w-12">
                      {isTop10 ? (
                        <span className={`
                          inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${index === 0 ? "bg-amber-400 text-amber-900" : ""}
                          ${index === 1 ? "bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200" : ""}
                          ${index === 2 ? "bg-orange-300 text-orange-900" : ""}
                          ${index >= 3 ? "text-zinc-500 dark:text-zinc-400 font-mono text-xs" : ""}
                        `}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 font-mono text-xs">{index + 1}</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <EntryLogo slug={entry.slug} name={entry.name} logo_url={entry.logo_url} image_url={entry.image_url} />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                          {entry.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {entry.elo_rating.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                      {entry.comparisons.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${entry.win_rate}%` }} />
                        </div>
                        <span className="text-zinc-600 dark:text-zinc-400 text-xs font-mono w-12 text-right">
                          {entry.comparisons === 0 ? "—" : `${entry.win_rate}%`}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${entry.skip_rate}%` }} />
                        </div>
                        <span className="text-zinc-600 dark:text-zinc-400 text-xs font-mono w-12 text-right">
                          {(entry.comparisons + (entry.skips ?? 0)) === 0 ? "—" : `${entry.skip_rate}%`}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center">
        {items.length} {items.length === 1 ? "item" : "items"} · Community-powered ELO rankings
      </p>
    </div>
  );
}
