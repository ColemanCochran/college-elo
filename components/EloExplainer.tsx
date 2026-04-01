export default function EloExplainer() {
  return (
    <section className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          How the Rankings Work
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          CollegeRank uses the ELO rating system — the same algorithm used in
          competitive chess — to determine college rankings through pairwise
          community voting.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Starting Rating
            </h3>
            <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
              1500
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Every college begins with the same ELO rating. Rankings emerge
              entirely from community votes.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              K-Factor
            </h3>
            <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
              32
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Controls how much each vote shifts the ELO. Higher means faster
              movement; lower means more stability.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:col-span-2">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Expected Score Formula
            </h3>
            <div className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              <span className="text-violet-600 dark:text-violet-400">E</span>
              <span className="text-zinc-500">(A) = </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                1 / (1 + 10
                <sup className="text-xs">
                  (R<sub>B</sub> − R<sub>A</sub>) / 400
                </sup>
                )
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              This gives the probability that college A beats college B. A 400-point
              difference means the higher-rated school wins ~91% of the time.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:col-span-2">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              After Each Vote
            </h3>
            <div className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div>
                <span className="text-emerald-600 dark:text-emerald-400">R′_winner</span>
                <span className="text-zinc-500"> = R_winner + K × (1 − E_winner)</span>
              </div>
              <div>
                <span className="text-red-500 dark:text-red-400">R′_loser</span>
                <span className="text-zinc-500"> = R_loser + K × (0 − E_loser)</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Upsets — when a lower-rated college wins — move the ratings more than
              expected outcomes, allowing underrated schools to rise quickly.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
            Why Repeated Voting Improves Accuracy
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            ELO is a self-correcting system. Early votes have high variance —
            a few surprise results can temporarily inflate or deflate a
            school&apos;s rating. But as the number of comparisons grows, the
            law of large numbers takes over: schools converge toward their
            &quot;true&quot; community-perceived ranking. The matchmaking
            algorithm prioritizes similar-ELO pairings to accelerate
            convergence, while occasionally introducing random matchups to
            discover surprising community preferences.
          </p>
        </div>
      </div>
    </section>
  );
}
