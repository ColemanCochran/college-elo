/**
 * Create a Duelist forum from a Kalshi prediction market event.
 *
 * Usage:
 *   npx tsx scripts/seed-from-kalshi.ts KXNEWPOPE-70
 *   npx tsx scripts/seed-from-kalshi.ts KXTRILLIONAIRE-30 --name "Who Will Be the First Trillionaire?"
 *
 * Options:
 *   --name "Custom Name"         Override the forum name (defaults to Kalshi event title)
 *   --description "Custom desc"  Override the description
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchJson(fetchUrl: string): Promise<any> {
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`Kalshi API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const ticker = args.find(a => !a.startsWith("--"));

  if (!ticker) {
    console.error("Usage: npx tsx scripts/seed-from-kalshi.ts <EVENT_TICKER> [--name \"...\"] [--description \"...\"]");
    console.error("\nTo find event tickers, browse https://kalshi.com or run:");
    console.error("  curl -s 'https://api.elections.kalshi.com/trade-api/v2/events?limit=50&status=open' | python3 -c \"import sys,json; [print(e['event_ticker'], e['title']) for e in json.load(sys.stdin)['events']]\"");
    process.exit(1);
  }

  // Parse optional flags
  const nameIdx = args.indexOf("--name");
  const descIdx = args.indexOf("--description");
  const customName = nameIdx !== -1 ? args[nameIdx + 1] : null;
  const customDesc = descIdx !== -1 ? args[descIdx + 1] : null;

  console.log(`Fetching Kalshi event: ${ticker}...\n`);

  // Fetch event metadata
  const eventData = await fetchJson(`${KALSHI_API}/events/${ticker}`);
  const event = eventData.event;
  if (!event) {
    console.error(`Event "${ticker}" not found on Kalshi.`);
    process.exit(1);
  }

  const forumName = customName ?? event.title;
  const forumDesc = customDesc ?? `Community ranking inspired by the Kalshi prediction market: ${event.title}`;
  const forumSlug = slugify(forumName);

  console.log(`Event: ${event.title}`);
  console.log(`Forum name: ${forumName}`);
  console.log(`Slug: ${forumSlug}`);

  // Check if already exists
  const { data: existing } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", forumSlug)
    .maybeSingle();

  if (existing) {
    console.log(`\nForum "${forumSlug}" already exists — skipping.`);
    process.exit(0);
  }

  // Fetch markets (outcomes) for this event
  const marketsData = await fetchJson(`${KALSHI_API}/markets?event_ticker=${ticker}&limit=200`);
  const markets = marketsData.markets ?? [];

  if (markets.length === 0) {
    console.error("No markets found for this event.");
    process.exit(1);
  }

  // Extract items from market outcomes
  const items: string[] = [];
  for (const market of markets) {
    // For mutually exclusive events, each market's yes_sub_title is an outcome
    const name = market.yes_sub_title || market.subtitle || market.title;
    if (name && !items.includes(name)) {
      items.push(name);
    }
  }

  console.log(`\nFound ${items.length} outcomes:`);
  items.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));

  if (items.length < 2) {
    console.error("\nNeed at least 2 items for a forum.");
    process.exit(1);
  }

  // Create topic
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .insert({
      name: forumName,
      slug: forumSlug,
      description: forumDesc,
      is_public: true,
      is_system: false,
      owner_id: null,
      leaderboard_unlock_votes: 10,
      topic_group: "kalshi",
    })
    .select("id, slug")
    .single();

  if (topicError || !topic) {
    console.error("Failed to create topic:", topicError?.message);
    process.exit(1);
  }

  // Insert items with deduplicated slugs
  const usedSlugs = new Set<string>();
  const itemRows = items.map((name) => {
    let base = slugify(name) || "item";
    let candidate = base;
    let i = 2;
    while (usedSlugs.has(candidate)) candidate = `${base}-${i++}`;
    usedSlugs.add(candidate);
    return { topic_id: topic.id, name, slug: candidate, elo_rating: 1500 };
  });

  const { error: itemsError } = await supabase.from("topic_items").insert(itemRows);

  if (itemsError) {
    console.error("Failed to insert items:", itemsError.message);
    await supabase.from("topics").delete().eq("id", topic.id);
    process.exit(1);
  }

  console.log(`\n\u2713 Created forum "${forumSlug}" with ${itemRows.length} items.`);
  console.log(`  View at: /topic/${forumSlug}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
