import Link from "next/link";

export const metadata = {
  title: "About — Duelist",
  description: "How Duelist uses ELO rankings to produce community-driven rankings for any topic.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight hover:opacity-80 transition-opacity"
          >
            Duelist
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-medium text-white dark:text-zinc-900 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Topics
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 sm:py-16">

        {/* Hero */}
        <div className="mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
            About Duelist
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Duelist is a community-powered ranking engine. Instead of relying on opaque
            editorial decisions or weighted metrics, we let people vote head-to-head and let the
            math do the rest. Pick any topic, vote, and watch the rankings emerge.
          </p>
        </div>

        {/* What is ELO */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            What is ELO?
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
            ELO is a rating system invented by physicist Arpad Elo to rank chess players. It works
            by comparing players head-to-head and updating both ratings after every match — the winner
            gains points, the loser loses the same. The key insight is that <em>how many points change</em> depends
            on how surprising the outcome was.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            If the top-rated item beats a lower-rated one, that&apos;s expected — ratings barely move.
            But if the lower-rated item wins, that&apos;s an upset — ratings shift dramatically, pulling
            the underdog up and the favorite down. Over thousands of matchups, this self-corrects into
            a highly accurate ranking.
          </p>
        </section>

        {/* Technical details */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            How the math works
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Starting Rating</h3>
              <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">1500</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Every item begins equal. Rankings emerge entirely from votes — no editorial bias.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">K-Factor</h3>
              <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100">32</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Controls how much each vote shifts ratings. 32 is moderately volatile — rankings
                move meaningfully but don&apos;t swing wildly from a single vote.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 mb-4">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Expected Score Formula</h3>
            <div className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              <span className="text-violet-600 dark:text-violet-400">E</span>
              <span className="text-zinc-500">(A) = </span>
              <span className="text-zinc-700 dark:text-zinc-300">
                1 / (1 + 10
                <sup className="text-xs">(R<sub>B</sub> − R<sub>A</sub>) / 400</sup>
                )
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              The probability that item A beats item B. A 400-point gap means the higher-rated
              item wins ~91% of the time. The larger the gap, the less surprising the outcome.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">After Each Vote</h3>
            <div className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div>
                <span className="text-emerald-600 dark:text-emerald-400">R′_winner</span>
                <span className="text-zinc-500"> = R_winner + 32 × (1 − E_winner)</span>
              </div>
              <div>
                <span className="text-red-500 dark:text-red-400">R′_loser</span>
                <span className="text-zinc-500"> = R_loser + 32 × (0 − E_loser)</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Upsets move ratings more. Expected outcomes move ratings less. The system is zero-sum:
              every point gained by one item is lost by the other.
            </p>
          </div>
        </section>

        {/* Why ELO */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Why ELO beats traditional rankings
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">1</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">No hidden weights</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Traditional rankings combine dozens of metrics using weights that change year to year.
                  The formula is opaque. Duelist has one input: your vote.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">2</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Self-correcting over time</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Early votes have high variance. But as comparisons accumulate, rankings converge
                  toward genuine community consensus. The more people vote, the more accurate it becomes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">3</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Topic-aware</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  A single overall ranking rarely captures reality. Duelist lets you vote — and see rankings —
                  scoped to specific topics, so niche expertise surfaces where it matters.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">4</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Resistant to gaming</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  The only way to move an item&apos;s rating is to win individual matchups against real opponents.
                  Ballot stuffing is rate-limited and IP-tracked.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Matchmaking */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            How matchups are chosen
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
            70% of matchups use smart pairing: the item with the fewest comparisons is selected,
            then matched against a similarly-rated opponent (within ~300 ELO points). This accelerates
            convergence by prioritising underexposed items and fair fights.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The other 30% are random pairings. This adds exploration — surfacing unexpected matchups
            that might reveal surprising community preferences, and preventing the algorithm from getting
            stuck in local patterns.
          </p>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Ready to shape the rankings?
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            Every vote improves accuracy. It takes less than a minute.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-semibold text-white dark:text-zinc-900 transition-colors"
          >
            Browse topics
          </Link>
        </div>
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-3xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 flex items-center justify-between">
          <span>Duelist</span>
          <Link href="/" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            Back to topics →
          </Link>
        </div>
      </footer>
    </div>
  );
}
