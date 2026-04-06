/**
 * Seed script — run with: npx tsx scripts/seed-coachella.ts
 *
 * Creates the "2026 Coachella Lineup" forum with 4 subtopics:
 *   - Overall (all artists)
 *   - Friday
 *   - Saturday
 *   - Sunday
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, key);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Artist lists by day ─────────────────────────────────────────────────────

const FRIDAY_ARTISTS = [
  "Sabrina Carpenter",
  "The xx",
  "Nine Inch Noize",
  "Disclosure",
  "Turnstile",
  "Ethel Cain",
  "Dijon",
  "Teddy Swims",
  "KATSEYE",
  "Devo",
  "Sexyy Red",
  "Central Cee",
  "Foster the People",
  "Levity",
  "Blood Orange",
  "Moby",
  "Marlon Hoffstadt",
  "Lykke Li",
  "fakemink",
  "Gordo",
  "Creepy Nuts",
  "Joyce Manor",
  "BINI",
  "Kettama",
  "Groove Armada",
  "Joost",
  "HUGEL",
  "CMAT",
  "Slayyyter",
  "Prospa",
  "Hot Mulligan",
  "Hamdi",
  "Fleshwater",
  "Max Styler",
  "Wednesday",
  "Dabeull",
  "The Two Lips",
  "Ninajirachi",
  "Max Dean x Luke Dean",
  "Cachirula & Loojan",
  "Jessica Brankka",
  "Chlo\u00e9 Caillet x Rossi",
  "Arodes",
  "NewDad",
  "Carolina Durante",
  "flowerovlove",
  "Febuary",
  "Bob Baker Marionettes",
  "Youna",
  "Sahar Z",
];

const SATURDAY_ARTISTS = [
  "Justin Bieber",
  "The Strokes",
  "Giveon",
  "Addison Rae",
  "Labrinth",
  "SOMBR",
  "David Byrne",
  "Interpol",
  "Alex G",
  "Swae Lee",
  "Solomun",
  "Taemin",
  "PinkPantheress",
  "Royel Otis",
  "REZZ",
  "Fujii Kaze",
  "Adriatique",
  "Davido",
  "Boys Noize",
  "Geese",
  "rusowsky",
  "\u00a5\u00d8U$UK\u20ac \u00a5UK1MAT$U",
  "Green Velvet \u00d7 AYYBO",
  "Lu\u00edsa Sonza",
  "ZULAN",
  "Los Hermanos Flores",
  "Bedouin",
  "Ceremony",
  "54 Ultra",
  "Noga Erez",
  "Ben Sterling",
  "Blondshell",
  "Lambrini Girls",
  "Ecca Vandal",
  "Mind Enterprises",
  "Freak Slug",
  "SOSA",
  "Mahmut Orhan",
  "Riordan",
  "Die Spitz",
  "WHATMORE",
  "GENESI",
  "Yamagucci",
];

const SUNDAY_ARTISTS = [
  "Karol G",
  "Young Thug",
  "Anyma",
  "Kaskade",
  "BIGBANG",
  "Laufey",
  "Major Lazer",
  "Iggy Pop",
  "FKA twigs",
  "Wet Leg",
  "Clipse",
  "Subtronics",
  "Little Simz",
  "Mochakk",
  "Duke Dumont",
  "Worship",
  "Armin van Buuren x Adam Beyer",
  "Holly Humberstone",
  "Gigi Perez",
  "The Rapture",
  "Suicidal Tendencies",
  "BUNT",
  "French Police",
  "Black Flag",
  "Oklou",
  "R\u00f6yksopp",
  "The Chats",
  "DRAIN",
  "Model/Actriz",
  "COBRAH",
  "Los Retros",
  "WhoMadeWho",
  "Jane Remover",
  "R\u00d8Z",
  "Glitterer",
  "Carlita x Josh Baker",
  "MESTIZA",
  "&friends",
  "AZZECCA",
  "LE YORA",
  "Samia",
  "Tomora",
];

const ALL_ARTISTS = [...FRIDAY_ARTISTS, ...SATURDAY_ARTISTS, ...SUNDAY_ARTISTS];

// ── Topic definitions ───────────────────────────────────────────────────────

const TOPIC_GROUP = "coachella-2026";

const TOPICS = [
  {
    slug: "coachella-2026",
    name: "Overall",
    description: "Rank every artist on the 2026 Coachella lineup head-to-head.",
    artists: ALL_ARTISTS,
  },
  {
    slug: "coachella-2026-friday",
    name: "Friday",
    description: "Rank Friday\u2019s Coachella 2026 lineup \u2014 headlined by Sabrina Carpenter.",
    artists: FRIDAY_ARTISTS,
  },
  {
    slug: "coachella-2026-saturday",
    name: "Saturday",
    description: "Rank Saturday\u2019s Coachella 2026 lineup \u2014 headlined by Justin Bieber.",
    artists: SATURDAY_ARTISTS,
  },
  {
    slug: "coachella-2026-sunday",
    name: "Sunday",
    description: "Rank Sunday\u2019s Coachella 2026 lineup \u2014 headlined by Karol G.",
    artists: SUNDAY_ARTISTS,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildItemRows(topicId: string, artists: string[]) {
  const usedSlugs = new Set<string>();
  return artists.map((name) => {
    let base = slugify(name) || "item";
    let candidate = base;
    let i = 2;
    while (usedSlugs.has(candidate)) candidate = `${base}-${i++}`;
    usedSlugs.add(candidate);
    return { topic_id: topicId, name, slug: candidate, elo_rating: 1500 };
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding 2026 Coachella Lineup forum...\n");

  for (const topicDef of TOPICS) {
    // Check if topic already exists
    const { data: existing } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", topicDef.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  \u2713 Topic "${topicDef.slug}" already exists \u2014 skipping.`);
      continue;
    }

    // Insert topic (is_system: false so votes go through topic_items, not elo_ratings)
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .insert({
        slug: topicDef.slug,
        name: topicDef.name,
        description: topicDef.description,
        is_public: true,
        is_system: false,
        owner_id: null,
        leaderboard_unlock_votes: 10,
        topic_group: TOPIC_GROUP,
      })
      .select("id, slug")
      .single();

    if (topicError || !topic) {
      console.error(`  \u2717 Failed to create topic "${topicDef.slug}":`, topicError?.message);
      process.exit(1);
    }

    // Insert items
    const itemRows = buildItemRows(topic.id, topicDef.artists);
    const { error: itemsError } = await supabase
      .from("topic_items")
      .insert(itemRows);

    if (itemsError) {
      console.error(`  \u2717 Failed to insert items for "${topicDef.slug}":`, itemsError.message);
      // Rollback the topic
      await supabase.from("topics").delete().eq("id", topic.id);
      process.exit(1);
    }

    console.log(`  \u2713 Created "${topicDef.slug}" with ${itemRows.length} artists.`);
  }

  console.log("\nDone! Visit /topic/coachella-2026 to start voting.");
}

seed();
