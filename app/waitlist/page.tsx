"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { joinWaitlist } from "@/app/actions/waitlist";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    const result = await joinWaitlist(email);
    if (!result) {
      setState("success");
    } else if (result.error === "already_on_list") {
      setState("already");
    } else {
      setErrorMsg(result.error);
      setState("error");
    }
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
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {state === "success" ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                You&apos;re on the list.
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                We&apos;ll email you when forum creation opens up. In the meantime, go vote on something.
              </p>
              <Link
                href="/"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity"
              >
                ← Back to Duelist
              </Link>
            </div>
          ) : state === "already" ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Already on it.
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                That email is already on the waitlist. We&apos;ll be in touch.
              </p>
              <Link
                href="/"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity"
              >
                ← Back to Duelist
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
                  We&apos;re still building.
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Duelist is a work in progress. Forum creation isn&apos;t open yet, but we&apos;re working on it — including private ranking forums you can share with just your friends.
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Think: a ranking forum just for your friend group, or — perhaps more entertainingly — a ranking forum <em>about</em> your friend group. We&apos;re not going to tell you what to do with that.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Your email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
                  />
                </div>

                {state === "error" && (
                  <p className="text-sm text-red-500 dark:text-red-400">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-sm font-semibold text-white dark:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state === "loading" ? "Joining…" : "Join the waitlist"}
                </button>
              </form>

              <p className="mt-5 text-xs text-zinc-400 dark:text-zinc-600 text-center">
                You can still vote on existing forums without an account.{" "}
                <Link href="/" className="underline hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                  Go vote
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-4 px-4">
        <div className="max-w-3xl mx-auto text-xs text-zinc-400 dark:text-zinc-600 text-center">
          Duelist
        </div>
      </footer>
    </div>
  );
}
