"use client";

import { useRouter } from "next/navigation";
import { College } from "@/types";
import { MatchupStat } from "@/app/actions/matchup";

interface Props {
  colleges: College[];
  selectedAId: string | null;
  selectedBId: string | null;
  stat: MatchupStat | null;
  topMatchups: MatchupStat[];
}

function WinBar({ aWins, bWins }: { aWins: number; bWins: number }) {
  const total = aWins + bWins;
  if (total === 0) return null;
  const aPct = Math.round((aWins / total) * 100);
  return (
    <div className="w-full h-2 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
      <div
        className="h-full bg-emerald-500 transition-all duration-500"
        style={{ width: `${aPct}%` }}
      />
      <div className="h-full flex-1 bg-sky-500" />
    </div>
  );
}

export default function HeadToHeadLookup({
  colleges,
  selectedAId,
  selectedBId,
  stat,
  topMatchups,
}: Props) {
  const router = useRouter();

  function handleChange(side: "a" | "b", id: string) {
    const params = new URLSearchParams();
    const a = side === "a" ? id : (selectedAId ?? "");
    const b = side === "b" ? id : (selectedBId ?? "");
    if (a) params.set("a", a);
    if (b) params.set("b", b);
    router.push(`/head-to-head?${params.toString()}`);
  }

  const schoolA = colleges.find((c) => c.id === selectedAId);
  const schoolB = colleges.find((c) => c.id === selectedBId);

  // stat stores canonical order (smaller UUID = college_a), so we need to
  // figure out which "side" each selected school is on.
  const isACanonical = selectedAId && selectedBId && selectedAId < selectedBId;
  const aWins = stat ? (isACanonical ? stat.a_wins : stat.b_wins) : 0;
  const bWins = stat ? (isACanonical ? stat.b_wins : stat.a_wins) : 0;
  const totalDecisive = aWins + bWins;
  const aPct = totalDecisive > 0 ? Math.round((aWins / totalDecisive) * 100) : null;
  const bPct = totalDecisive > 0 ? Math.round((bWins / totalDecisive) * 100) : null;

  return (
    <div className="flex flex-col gap-8">
      {/* School pickers */}
      <div className="flex items-center gap-3">
        <select
          value={selectedAId ?? ""}
          onChange={(e) => handleChange("a", e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        >
          <option value="">Select a school…</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id} disabled={c.id === selectedBId}>
              {c.name}
            </option>
          ))}
        </select>

        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 flex-shrink-0">
          VS
        </span>

        <select
          value={selectedBId ?? ""}
          onChange={(e) => handleChange("b", e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        >
          <option value="">Select a school…</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id} disabled={c.id === selectedAId}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Head-to-head result */}
      {schoolA && schoolB && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {stat && stat.appearances > 0 ? (
            <div className="p-6 flex flex-col gap-5">
              {/* School names + win counts */}
              <div className="grid grid-cols-3 items-center text-center gap-4">
                <div>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {aWins}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1 leading-tight">
                    {schoolA.name}
                  </p>
                  {aPct !== null && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {aPct}% win rate
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 tracking-widest">
                    HEAD TO HEAD
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {stat.appearances} matchup{stat.appearances !== 1 ? "s" : ""}
                  </span>
                </div>

                <div>
                  <p className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
                    {bWins}
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1 leading-tight">
                    {schoolB.name}
                  </p>
                  {bPct !== null && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {bPct}% win rate
                    </p>
                  )}
                </div>
              </div>

              {/* Win bar */}
              <WinBar aWins={aWins} bWins={bWins} />

              {/* Footer stats */}
              <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{totalDecisive} decisive vote{totalDecisive !== 1 ? "s" : ""}</span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{stat.skips} skip{stat.skips !== 1 ? "s" : ""}</span>
                {stat.appearances > 0 && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span>
                      {Math.round((stat.skips / stat.appearances) * 100)}% skip rate
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                These two schools haven&apos;t been matched up yet.
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
                Keep voting — this matchup may appear soon.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top matchups table */}
      {topMatchups.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Most played matchups
          </h2>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                  <th className="text-left px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">School A</th>
                  <th className="text-left px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">School B</th>
                  <th className="text-right px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Matchups</th>
                  <th className="text-right px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell w-40">Split</th>
                </tr>
              </thead>
              <tbody>
                {topMatchups.map((m) => {
                  const decisive = m.a_wins + m.b_wins;
                  const aPct = decisive > 0 ? Math.round((m.a_wins / decisive) * 100) : 50;
                  return (
                    <tr
                      key={`${m.college_a_id}-${m.college_b_id}`}
                      className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("a", m.college_a.id);
                        params.set("b", m.college_b.id);
                        router.push(`/head-to-head?${params.toString()}`);
                      }}
                    >
                      <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100 font-medium">
                        {m.college_a.name}
                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-mono">{m.a_wins}W</span>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100 font-medium">
                        {m.college_b.name}
                        <span className="ml-2 text-xs text-sky-600 dark:text-sky-400 font-mono">{m.b_wins}W</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-500 dark:text-zinc-400 font-mono hidden sm:table-cell">
                        {m.appearances}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 h-1.5 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
                            <div className="h-full bg-emerald-500" style={{ width: `${aPct}%` }} />
                            <div className="h-full flex-1 bg-sky-500" />
                          </div>
                          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-16 text-right">
                            {decisive > 0 ? `${aPct}/${100 - aPct}` : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
