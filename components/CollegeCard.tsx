"use client";

import Image from "next/image";
import { useState } from "react";
import { College } from "@/types";

interface CollegeCardProps {
  college: College;
  side: "left" | "right";
  onSelect: () => void;
  disabled: boolean;
  selected?: boolean;
  lost?: boolean;
}

// Local logos stored in /public/logos/
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

function getLogoUrl(slug: string): string | null {
  return LOGO_MAP[slug] ?? null;
}

const STATE_MAP: Record<string, { state: string; type: "Public" | "Private" }> =
  {
    harvard: { state: "MA", type: "Private" },
    stanford: { state: "CA", type: "Private" },
    mit: { state: "MA", type: "Private" },
    princeton: { state: "NJ", type: "Private" },
    yale: { state: "CT", type: "Private" },
    columbia: { state: "NY", type: "Private" },
    uchicago: { state: "IL", type: "Private" },
    upenn: { state: "PA", type: "Private" },
    duke: { state: "NC", type: "Private" },
    northwestern: { state: "IL", type: "Private" },
    "johns-hopkins": { state: "MD", type: "Private" },
    dartmouth: { state: "NH", type: "Private" },
    brown: { state: "RI", type: "Private" },
    cornell: { state: "NY", type: "Private" },
    rice: { state: "TX", type: "Private" },
    vanderbilt: { state: "TN", type: "Private" },
    "notre-dame": { state: "IN", type: "Private" },
    georgetown: { state: "DC", type: "Private" },
    emory: { state: "GA", type: "Private" },
    washu: { state: "MO", type: "Private" },
    tufts: { state: "MA", type: "Private" },
    cmu: { state: "PA", type: "Private" },
    "uc-berkeley": { state: "CA", type: "Public" },
    ucla: { state: "CA", type: "Public" },
    umich: { state: "MI", type: "Public" },
    uva: { state: "VA", type: "Public" },
    unc: { state: "NC", type: "Public" },
    usc: { state: "CA", type: "Private" },
    ucsd: { state: "CA", type: "Public" },
    "uc-davis": { state: "CA", type: "Public" },
    "ut-austin": { state: "TX", type: "Public" },
    gatech: { state: "GA", type: "Public" },
    "uw-madison": { state: "WI", type: "Public" },
    uiuc: { state: "IL", type: "Public" },
    purdue: { state: "IN", type: "Public" },
    "penn-state": { state: "PA", type: "Public" },
    "ohio-state": { state: "OH", type: "Public" },
    "uw-seattle": { state: "WA", type: "Public" },
    bu: { state: "MA", type: "Private" },
    northeastern: { state: "MA", type: "Private" },
    tulane: { state: "LA", type: "Private" },
    "case-western": { state: "OH", type: "Private" },
    rochester: { state: "NY", type: "Private" },
    "wake-forest": { state: "NC", type: "Private" },
    rpi: { state: "NY", type: "Private" },
    "william-and-mary": { state: "VA", type: "Public" },
    uf: { state: "FL", type: "Public" },
    uga: { state: "GA", type: "Public" },
    indiana: { state: "IN", type: "Public" },
    umn: { state: "MN", type: "Public" },
  };

export default function CollegeCard({
  college,
  side,
  onSelect,
  disabled,
  selected,
  lost,
}: CollegeCardProps) {
  const [logoError, setLogoError] = useState(false);
  const meta = STATE_MAP[college.slug];
  const logoUrl = getLogoUrl(college.slug);
  const showLogo = logoUrl && !logoError;

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      aria-label={`Vote for ${college.name}`}
      className={`
        group relative flex flex-col items-center justify-center
        w-full h-full min-h-[280px] sm:min-h-[320px]
        rounded-2xl border bg-white dark:bg-zinc-900
        transition-all duration-200 ease-out
        select-none outline-none
        ${!disabled && !selected && !lost
          ? "cursor-pointer border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-zinc-400 dark:hover:border-zinc-500 active:scale-[0.99]"
          : "cursor-default"
        }
        ${selected
          ? "border-emerald-500 dark:border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02] bg-emerald-50 dark:bg-emerald-950/40"
          : ""
        }
        ${lost
          ? "border-zinc-200 dark:border-zinc-800 opacity-40 scale-[0.98]"
          : ""
        }
        focus-visible:ring-2 focus-visible:ring-zinc-400
      `}
    >
      {/* Keyboard hint */}
      {!disabled && !selected && !lost && (
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            {side === "left" ? "←" : "→"}
          </kbd>
        </div>
      )}

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 p-6 sm:p-8 w-full">
        {/* Logo */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          {showLogo ? (
            <Image
              src={logoUrl}
              alt={`${college.name} logo`}
              width={96}
              height={96}
              className="object-contain w-full h-full drop-shadow-sm"
              unoptimized
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-2xl font-bold text-zinc-400">
                {college.name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
            {college.name}
          </h2>
          {meta && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {meta.state} &middot;{" "}
              <span
                className={
                  meta.type === "Private"
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-sky-600 dark:text-sky-400"
                }
              >
                {meta.type}
              </span>
            </p>
          )}
        </div>

      </div>
    </button>
  );
}
