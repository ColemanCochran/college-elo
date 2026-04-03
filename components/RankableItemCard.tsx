"use client";

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

// Verified Wikipedia Commons 250px PNG thumbnails for known college slugs.
// For user-created topic items these won't match, so the card falls through to image_url.
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
  "johns-hopkins": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fb/Johns_Hopkins_University_logo.svg/250px-Johns_Hopkins_University_logo.svg.png",
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
  usc: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/University_of_Southern_California_%28USC%29_seal.svg/250px-University_of_Southern_California_%28USC%29_seal.svg.png",
  "uc-davis": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/UC_Davis_wordmark.svg/250px-UC_Davis_wordmark.svg.png",
  "ut-austin": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/University_of_Texas_at_Austin_seal.svg/250px-University_of_Texas_at_Austin_seal.svg.png",
  gatech: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Georgia_Tech_seal.svg/250px-Georgia_Tech_seal.svg.png",
  "uw-madison": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Seal_of_the_University_of_Wisconsin.svg/250px-Seal_of_the_University_of_Wisconsin.svg.png",
  uiuc: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/University_of_Illinois_seal.svg/250px-University_of_Illinois_seal.svg.png",
  purdue: "https://upload.wikimedia.org/wikipedia/en/thumb/6/61/Purdue_University_seal.svg/250px-Purdue_University_seal.svg.png",
  "penn-state": "https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Penn_State_Nittany_Lions_logo.svg/250px-Penn_State_Nittany_Lions_logo.svg.png",
  "ohio-state": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/Ohio_State_University_seal.svg/250px-Ohio_State_University_seal.svg.png",
  "uw-seattle": "https://upload.wikimedia.org/wikipedia/en/thumb/5/58/University_of_Washington_seal.svg/250px-University_of_Washington_seal.svg.png",
  bu: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Boston_University_seal.svg/250px-Boston_University_seal.svg.png",
  northeastern: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/NU_RGB_seal_R.png/250px-NU_RGB_seal_R.png",
  tulane: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Tulane_University_Logo.svg/250px-Tulane_University_Logo.svg.png",
  "case-western": "https://upload.wikimedia.org/wikipedia/en/thumb/0/08/Case_Western_Reserve_University_seal.svg/250px-Case_Western_Reserve_University_seal.svg.png",
  rochester: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c8/University_of_Rochester_seal.svg/250px-University_of_Rochester_seal.svg.png",
  "wake-forest": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0a/Wake_Forest_University_seal.svg/250px-Wake_Forest_University_seal.svg.png",
  rpi: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Rensselear_poly_inst_seal.png/250px-Rensselear_poly_inst_seal.png",
  uf: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/University_of_Florida_seal.svg/250px-University_of_Florida_seal.svg.png",
  uga: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/University_of_Georgia_logo.svg/250px-University_of_Georgia_logo.svg.png",
  indiana: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Indiana_University_seal.svg/250px-Indiana_University_seal.svg.png",
  umn: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Seal_of_the_University_of_Minnesota.svg/250px-Seal_of_the_University_of_Minnesota.svg.png",
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
  const meta = STATE_MAP[item.slug];

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
        {/* Name + optional college metadata */}
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
            {item.name}
          </h2>
          {meta && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {meta.state} &middot;{" "}
              <span className={meta.type === "Private" ? "text-violet-600 dark:text-violet-400" : "text-sky-600 dark:text-sky-400"}>
                {meta.type}
              </span>
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
