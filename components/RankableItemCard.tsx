"use client";

import { useState } from "react";
import { getFlag } from "@/lib/flags";

export interface RankableCardItem {
  id: string;
  name: string;
  slug: string;
  /** Used for user-created topic items. Falls back to LOGO_MAP for college slugs. */
  image_url?: string | null;
  /** Present on College rows; treated as fallback if image_url is absent. */
  logo_url?: string | null;
}

interface RankableItemCardProps {
  item: RankableCardItem;
  side: "left" | "right";
  onSelect: () => void;
  disabled: boolean;
  selected?: boolean;
  lost?: boolean;
}

// Local logos stored in /public/logos/ — sourced from Logopedia and Wikimedia Commons.
// For user-created topic items these won't match, so the card falls through to image_url.
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
  // Employers
  adobe: "/logos/adobe.png",
  airbnb: "/logos/airbnb.png",
  amazon: "/logos/amazon.png",
  apple: "/logos/apple.png",
  "bain-company": "/logos/bain-company.png",
  "bank-of-america": "/logos/bank-of-america.png",
  blackrock: "/logos/blackrock.png",
  bloomberg: "/logos/bloomberg.png",
  boeing: "/logos/boeing.png",
  "boston-consulting-group": "/logos/boston-consulting-group.png",
  "capital-one": "/logos/capital-one.png",
  citadel: "/logos/citadel.png",
  citi: "/logos/citi.png",
  deloitte: "/logos/deloitte.png",
  "electronic-arts": "/logos/electronic-arts.png",
  "ernst-young": "/logos/ernst-young.png",
  "goldman-sachs": "/logos/goldman-sachs.png",
  google: "/logos/google.png",
  ibm: "/logos/ibm.png",
  intel: "/logos/intel.png",
  "jane-street": "/logos/jane-street.png",
  "johnson-johnson": "/logos/johnson-johnson.png",
  "jp-morgan": "/logos/jp-morgan.png",
  kpmg: "/logos/kpmg.png",
  loral: "/logos/loral.png",
  "lockheed-martin": "/logos/lockheed-martin.png",
  "mckinsey-company": "/logos/mckinsey-company.png",
  meta: "/logos/meta.png",
  microsoft: "/logos/microsoft.png",
  "morgan-stanley": "/logos/morgan-stanley.png",
  nasa: "/logos/nasa.png",
  netflix: "/logos/netflix.png",
  nike: "/logos/nike.png",
  "northrop-grumman": "/logos/northrop-grumman.png",
  nvidia: "/logos/nvidia.png",
  openai: "/logos/openai.png",
  "palantir-technologies": "/logos/palantir-technologies.png",
  pfizer: "/logos/pfizer.png",
  "procter-gamble": "/logos/procter-gamble.png",
  pwc: "/logos/pwc.png",
  salesforce: "/logos/salesforce.png",
  sony: "/logos/sony.png",
  spacex: "/logos/spacex.png",
  spotify: "/logos/spotify.png",
  stripe: "/logos/stripe.png",
  tesla: "/logos/tesla.png",
  "the-walt-disney-company": "/logos/the-walt-disney-company.png",
  uber: "/logos/uber.png",
  unilever: "/logos/unilever.png",
  visa: "/logos/visa.png",
  // Coachella 2026 artists
  "54-ultra": "/logos/54-ultra.png",
  "addison-rae": "/logos/addison-rae.png",
  "alex-g": "/logos/alex-g.png",
  anyma: "/logos/anyma.png",
  "armin-van-buuren-x-adam-beyer": "/logos/armin-van-buuren-x-adam-beyer.png",
  "ben-sterling": "/logos/ben-sterling.png",
  bigbang: "/logos/bigbang.png",
  bini: "/logos/bini.png",
  "black-flag": "/logos/black-flag.png",
  blondshell: "/logos/blondshell.png",
  "blood-orange": "/logos/blood-orange.png",
  "bob-baker-marionettes": "/logos/bob-baker-marionettes.png",
  "boys-noize": "/logos/boys-noize.png",
  "carolina-durante": "/logos/carolina-durante.png",
  "central-cee": "/logos/central-cee.png",
  ceremony: "/logos/ceremony.png",
  clipse: "/logos/clipse.png",
  cmat: "/logos/cmat.png",
  "creepy-nuts": "/logos/creepy-nuts.png",
  "david-byrne": "/logos/david-byrne.png",
  davido: "/logos/davido.png",
  devo: "/logos/devo.png",
  "die-spitz": "/logos/die-spitz.png",
  "duke-dumont": "/logos/duke-dumont.png",
  "ethel-cain": "/logos/ethel-cain.png",
  fakemink: "/logos/fakemink.png",
  "fka-twigs": "/logos/fka-twigs.png",
  "foster-the-people": "/logos/foster-the-people.png",
  "french-police": "/logos/french-police.png",
  geese: "/logos/geese.png",
  "gigi-perez": "/logos/gigi-perez.png",
  giveon: "/logos/giveon.png",
  gordo: "/logos/gordo.png",
  "green-velvet-ayybo": "/logos/green-velvet-ayybo.png",
  "groove-armada": "/logos/groove-armada.png",
  "holly-humberstone": "/logos/holly-humberstone.png",
  "hot-mulligan": "/logos/hot-mulligan.png",
  "iggy-pop": "/logos/iggy-pop.png",
  interpol: "/logos/interpol.png",
  "jane-remover": "/logos/jane-remover.png",
  joost: "/logos/joost.png",
  "joyce-manor": "/logos/joyce-manor.png",
  "justin-bieber": "/logos/justin-bieber.png",
  "karol-g": "/logos/karol-g.png",
  kaskade: "/logos/kaskade.png",
  katseye: "/logos/katseye.png",
  labrinth: "/logos/labrinth.png",
  "lambrini-girls": "/logos/lambrini-girls.png",
  laufey: "/logos/laufey.png",
  "little-simz": "/logos/little-simz.png",
  "lykke-li": "/logos/lykke-li.png",
  "mahmut-orhan": "/logos/mahmut-orhan.png",
  "major-lazer": "/logos/major-lazer.png",
  "max-dean-x-luke-dean": "/logos/max-dean-x-luke-dean.png",
  moby: "/logos/moby.png",
  newdad: "/logos/newdad.png",
  "nine-inch-noize": "/logos/nine-inch-noize.png",
  "noga-erez": "/logos/noga-erez.png",
  oklou: "/logos/oklou.png",
  pinkpantheress: "/logos/pinkpantheress.png",
  rezz: "/logos/rezz.png",
  riordan: "/logos/riordan.png",
  "sabrina-carpenter": "/logos/sabrina-carpenter.png",
  "sahar-z": "/logos/sahar-z.png",
  samia: "/logos/samia.png",
  slayyyter: "/logos/slayyyter.png",
  sombr: "/logos/sombr.png",
  sosa: "/logos/sosa.png",
  subtronics: "/logos/subtronics.png",
  "suicidal-tendencies": "/logos/suicidal-tendencies.png",
  "swae-lee": "/logos/swae-lee.png",
  taemin: "/logos/taemin.png",
  "teddy-swims": "/logos/teddy-swims.png",
  "the-chats": "/logos/the-chats.png",
  "the-rapture": "/logos/the-rapture.png",
  "the-strokes": "/logos/the-strokes.png",
  "the-xx": "/logos/the-xx.png",
  turnstile: "/logos/turnstile.png",
  "wet-leg": "/logos/wet-leg.png",
  whomadewho: "/logos/whomadewho.png",
  "young-thug": "/logos/young-thug.png",
  "röyksopp": "/logos/röyksopp.png",
  "luísa-sonza": "/logos/luísa-sonza.png",
};

const STATE_MAP: Record<string, { state: string; type: "Public" | "Private" }> = {
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

export default function RankableItemCard({
  item,
  side,
  onSelect,
  disabled,
  selected,
  lost,
}: RankableItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const resolvedUrl = LOGO_MAP[item.slug] ?? item.logo_url ?? item.image_url ?? null;
  const flag = getFlag(item.slug);
  const showImage = resolvedUrl && !imageError;

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      aria-label={`Vote for ${item.name}`}
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
        ${lost ? "border-zinc-200 dark:border-zinc-800 opacity-40 scale-[0.98]" : ""}
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
        {flag ? (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm">
            <span className="text-5xl sm:text-6xl leading-none">{flag}</span>
          </div>
        ) : showImage ? (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm">
            <img
              src={resolvedUrl}
              alt={`${item.name} logo`}
              className="w-full h-full object-contain p-1"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <span className="text-2xl font-bold text-zinc-500 dark:text-zinc-400">
              {item.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
            {item.name}
          </h2>
        </div>
      </div>
    </button>
  );
}
