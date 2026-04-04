"use client";

import { useState, useMemo } from "react";

const LOGO_MAP: Record<string, string> = {
  harvard: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Harvard_University_coat_of_arms.svg/250px-Harvard_University_coat_of_arms.svg.png",
  stanford: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Seal_of_Leland_Stanford_Junior_University.svg/250px-Seal_of_Leland_Stanford_Junior_University.svg.png",
  mit: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/MIT_2023_red_logo.svg/250px-MIT_2023_red_logo.svg.png",
  princeton: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_seal.svg/250px-Princeton_seal.svg.png",
  yale: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Yale_University_Shield_1.svg/250px-Yale_University_Shield_1.svg.png",
  columbia: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Coat_of_Arms_of_Columbia_University.svg/250px-Coat_of_Arms_of_Columbia_University.svg.png",
  uchicago: "https://upload.wikimedia.org/wikipedia/en/thumb/7/79/University_of_Chicago_shield.svg/250px-University_of_Chicago_shield.svg.png",
  upenn: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UPenn_shield_with_banner.svg/250px-UPenn_shield_with_banner.svg.png",
  duke: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Duke_University_logo.svg/250px-Duke_University_logo.svg.png",
  northwestern: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Northwestern_University_seal.svg/250px-Northwestern_University_seal.svg.png",
  "johns-hopkins": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Johns_Hopkins_University%27s_Academic_Seal.svg/250px-Johns_Hopkins_University%27s_Academic_Seal.svg.png",
  dartmouth: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Dartmouth_College_shield.svg/250px-Dartmouth_College_shield.svg.png",
  brown: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Brown_seal.svg/250px-Brown_seal.svg.png",
  cornell: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cornell_University_seal.svg/250px-Cornell_University_seal.svg.png",
  rice: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/Rice_University_seal.svg/250px-Rice_University_seal.svg.png",
  vanderbilt: "https://upload.wikimedia.org/wikipedia/en/thumb/2/29/Vanderbilt_University_seal.svg/250px-Vanderbilt_University_seal.svg.png",
  "notre-dame": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/University_of_Notre_Dame_seal_%282%29.svg/250px-University_of_Notre_Dame_seal_%282%29.svg.png",
  georgetown: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Georgetown_University_seal.svg/250px-Georgetown_University_seal.svg.png",
  emory: "https://upload.wikimedia.org/wikipedia/en/thumb/3/32/Emory_Eagles_logo.svg/250px-Emory_Eagles_logo.svg.png",
  tufts: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Tufts_University_wordmark.svg/250px-Tufts_University_wordmark.svg.png",
  cmu: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Carnegie_Mellon_wordmark.svg/250px-Carnegie_Mellon_wordmark.svg.png",
  "uc-berkeley": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Seal_of_the_University_of_California.svg/250px-Seal_of_the_University_of_California.svg.png",
  ucla: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/UCLA_Bruins_logo.svg/250px-UCLA_Bruins_logo.svg.png",
  umich: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Seal_of_the_University_of_Michigan.svg/250px-Seal_of_the_University_of_Michigan.svg.png",
  uva: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/University_of_Virginia_seal.svg/250px-University_of_Virginia_seal.svg.png",
  unc: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/University_of_North_Carolina_at_Chapel_Hill_seal.svg/250px-University_of_North_Carolina_at_Chapel_Hill_seal.svg.png",
  usc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/University_of_Southern_California_%28USC%29_seal.svg/250px-University_of_Southern_California_%28USC%29_seal.svg.png",
  "uc-davis": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/UC_Davis_wordmark.svg/250px-UC_Davis_wordmark.svg.png",
  "ut-austin": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/University_of_Texas_at_Austin_seal.svg/250px-University_of_Texas_at_Austin_seal.svg.png",
  gatech: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Georgia_Tech_seal.svg/250px-Georgia_Tech_seal.svg.png",
  "uw-madison": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Seal_of_the_University_of_Wisconsin.svg/250px-Seal_of_the_University_of_Wisconsin.svg.png",
  uiuc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/University_of_Illinois_seal.svg/250px-University_of_Illinois_seal.svg.png",
  purdue: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Purdue_University_seal.svg/250px-Purdue_University_seal.svg.png",
  "penn-state": "https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Penn_State_Nittany_Lions_logo.svg/250px-Penn_State_Nittany_Lions_logo.svg.png",
  "ohio-state": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/Ohio_State_University_seal.svg/250px-Ohio_State_University_seal.svg.png",
  "uw-seattle": "https://upload.wikimedia.org/wikipedia/en/thumb/5/58/University_of_Washington_seal.svg/250px-University_of_Washington_seal.svg.png",
  bu: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Boston_University_seal.svg/250px-Boston_University_seal.svg.png",
  northeastern: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/NU_RGB_seal_R.png/250px-NU_RGB_seal_R.png",
  tulane: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Tulane_University_Logo.svg/250px-Tulane_University_Logo.svg.png",
  "case-western": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Case_Western_Reserve_University_seal.svg/250px-Case_Western_Reserve_University_seal.svg.png",
  rochester: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/University_of_Rochester_seal.svg/250px-University_of_Rochester_seal.svg.png",
  "wake-forest": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0a/Wake_Forest_University_seal.svg/250px-Wake_Forest_University_seal.svg.png",
  rpi: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Rensselear_poly_inst_seal.png/250px-Rensselear_poly_inst_seal.png",
  uf: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/University_of_Florida_seal.svg/250px-University_of_Florida_seal.svg.png",
  uga: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/University_of_Georgia_logo.svg/250px-University_of_Georgia_logo.svg.png",
  indiana: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Indiana_University_seal.svg/250px-Indiana_University_seal.svg.png",
  umn: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Seal_of_the_University_of_Minnesota.svg/250px-Seal_of_the_University_of_Minnesota.svg.png",
  caltech: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Seal_of_the_California_Institute_of_Technology.svg/250px-Seal_of_the_California_Institute_of_Technology.svg.png",
  nyu: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/New_York_University_Seal.svg/250px-New_York_University_Seal.svg.png",
  washu: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/WashU_St._Louis_seal.svg/250px-WashU_St._Louis_seal.svg.png",
  ucsc: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/The_University_of_California_1868_UCSC.svg/250px-The_University_of_California_1868_UCSC.svg.png",
  amherst: "https://upload.wikimedia.org/wikipedia/en/thumb/6/65/Amherst_College_Seal.svg/250px-Amherst_College_Seal.svg.png",
  "harvey-mudd": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Harvey_Mudd_College_seal.svg/250px-Harvey_Mudd_College_seal.svg.png",
  williams: "https://upload.wikimedia.org/wikipedia/en/thumb/1/19/Williams_College_Seal.svg/250px-Williams_College_Seal.svg.png",
  pomona: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Pomona_College_seal.svg/250px-Pomona_College_seal.svg.png",
  uci: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/The_University_of_California_Irvine.svg/250px-The_University_of_California_Irvine.svg.png",
  ucsb: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/UC_Santa_Barbara_Seal.png/250px-UC_Santa_Barbara_Seal.png",
  umd: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/University_of_Maryland_seal.svg/250px-University_of_Maryland_seal.svg.png",
  "william-and-mary": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/College_of_William_%26_Mary_Coat_of_Arms.png/250px-College_of_William_%26_Mary_Coat_of_Arms.png",
  "boston-college": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Boston_College_seal.svg/250px-Boston_College_seal.svg.png",
  baylor: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f0/Baylor_University_seal.svg/250px-Baylor_University_seal.svg.png",
  bowdoin: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Formal_Seal_of_Bowdoin_College%2C_Brunswick%2C_ME%2C_USA.svg/250px-Formal_Seal_of_Bowdoin_College%2C_Brunswick%2C_ME%2C_USA.svg.png",
  "claremont-mckenna": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Claremont_McKenna_College_Seal.svg/250px-Claremont_McKenna_College_Seal.svg.png",
  "texas-am": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/Texas_A%26M_University_seal.svg/250px-Texas_A%26M_University_seal.svg.png",
  "cu-boulder": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Seal_of_the_University_of_Colorado.svg/250px-Seal_of_the_University_of_Colorado.svg.png",
  "colorado-mines": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Colorado_School_of_Mines_seal.svg/250px-Colorado_School_of_Mines_seal.svg.png",
};

function EntryLogo({ slug, name, logo_url, image_url }: { slug: string; name: string; logo_url?: string | null; image_url?: string | null }) {
  const [error, setError] = useState(false);
  const url = LOGO_MAP[slug] ?? logo_url ?? image_url ?? null;
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
