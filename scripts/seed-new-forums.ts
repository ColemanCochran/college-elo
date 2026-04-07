/**
 * Seed script — run with: npx tsx scripts/seed-new-forums.ts
 *
 * Creates 7 new community forums with 50 items each.
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Forum definitions ───────────────────────────────────────────────────────

const FORUMS = [
  {
    slug: "best-fast-food-chain",
    name: "Best Fast Food Chain",
    description: "Vote head-to-head on the best fast food chain in America.",
    items: [
      "McDonald's", "Chick-fil-A", "In-N-Out", "Wendy's", "Taco Bell",
      "Popeyes", "Burger King", "Five Guys", "Chipotle", "Shake Shack",
      "Whataburger", "Raising Cane's", "Panda Express", "Subway", "Arby's",
      "Culver's", "Sonic", "Jack in the Box", "Wingstop", "Jersey Mike's",
      "Chili's", "Panera Bread", "KFC", "Dairy Queen", "Zaxby's",
      "Firehouse Subs", "Jimmy John's", "Domino's", "Pizza Hut", "Papa John's",
      "Little Caesars", "Steak 'n Shake", "Hardee's", "Carl's Jr.", "Nando's",
      "Checkers", "Moe's Southwest Grill", "Qdoba", "El Pollo Loco", "Del Taco",
      "Bojangles", "Church's Chicken", "Portillo's", "White Castle", "Waffle House",
      "Cracker Barrel", "Cook Out", "Freddy's", "Tropical Smoothie Cafe", "Potbelly",
    ],
  },
  {
    slug: "best-netflix-original-series",
    name: "Best Netflix Original Series",
    description: "Rank the best Netflix original shows of all time.",
    items: [
      "Stranger Things", "Squid Game", "Wednesday", "Bridgerton", "The Witcher",
      "Ozark", "You", "The Crown", "Money Heist", "Cobra Kai",
      "Black Mirror", "Narcos", "The Queen's Gambit", "Outer Banks", "Emily in Paris",
      "Lupin", "Dark", "Mindhunter", "BoJack Horseman", "The Umbrella Academy",
      "Never Have I Ever", "Sex Education", "Ginny & Georgia", "Heartstopper", "All of Us Are Dead",
      "Alice in Borderland", "Shadow and Bone", "Dahmer", "Inventing Anna", "The Night Agent",
      "Beef", "Baby Reindeer", "The Diplomat", "Ripley", "One Piece",
      "3 Body Problem", "Nobody Wants This", "Fool Me Once", "The Lincoln Lawyer", "Virgin River",
      "Manifest", "Sweet Tooth", "Arcane", "Behind Her Eyes", "Clickbait",
      "The OA", "Sense8", "Marco Polo", "Bloodline", "Castlevania",
    ],
  },
  {
    slug: "best-album-2025-2026",
    name: "Best Album of 2025/2026",
    description: "Vote on the best albums from 2025 and 2026.",
    items: [
      "GNX \u2014 Kendrick Lamar",
      "Hurry Up Tomorrow \u2014 The Weeknd",
      "Brat \u2014 Charli XCX",
      "Short n' Sweet \u2014 Sabrina Carpenter",
      "Chromakopia \u2014 Tyler the Creator",
      "Hit Me Hard and Soft \u2014 Billie Eilish",
      "The Tortured Poets Department \u2014 Taylor Swift",
      "Cowboy Carter \u2014 Beyonc\u00e9",
      "Eternal Sunshine \u2014 Ariana Grande",
      "We Don't Trust You \u2014 Future & Metro Boomin",
      "Vultures 1 \u2014 Kanye West & Ty Dolla Sign",
      "SOS Deluxe \u2014 SZA",
      "Michael \u2014 Killer Mike",
      "This Is Why \u2014 Paramore",
      "The Record \u2014 Boygenius",
      "Did You Know That There's a Tunnel Under Ocean Blvd \u2014 Lana Del Rey",
      "Guts \u2014 Olivia Rodrigo",
      "Midnights \u2014 Taylor Swift",
      "One Thing at a Time \u2014 Morgan Wallen",
      "Gettin' Old \u2014 Luke Combs",
      "1989 (Taylor's Version) \u2014 Taylor Swift",
      "Stick Season \u2014 Noah Kahan",
      "Zach Bryan \u2014 Zach Bryan",
      "The Great Impersonator \u2014 Halsey",
      "Radical Optimism \u2014 Dua Lipa",
      "Preacher's Daughter \u2014 Ethel Cain",
      "Desire I Want to Turn Into You \u2014 Caroline Polachek",
      "Heaven Knows \u2014 PinkPantheress",
      "I Lay Down My Life for You \u2014 JPEGMAFIA",
      "Deeper Well \u2014 Kacey Musgraves",
      "Diamond Jubilee \u2014 Cindy Lee",
      "I Got Heaven \u2014 Mannequin Pussy",
      "Blue Rev \u2014 Alvvays",
      "Sundial \u2014 Noname",
      "In Waves \u2014 Jamie xx",
      "TANGK \u2014 IDLES",
      "Imaginal Disk \u2014 Magdalena Bay",
      "Lives Outgrown \u2014 Beth Gibbons",
      "Bright Future \u2014 Adrianne Lenker",
      "Green \u2014 Bon Iver",
      "Wall of Eyes \u2014 The Smile",
      "Romance \u2014 Fontaines D.C.",
      "Only God Was Above Us \u2014 Vampire Weekend",
      "Tiger's Blood \u2014 Waxahatchee",
      "Songs of a Lost World \u2014 The Cure",
      "Moon Music \u2014 Coldplay",
      "Absolute Elsewhere \u2014 Blood Incantation",
      "LOVE/HATE \u2014 Glorilla",
      "Manning Fireworks \u2014 MJ Lenderman",
      "Houdini \u2014 Dua Lipa",
    ],
  },
  {
    slug: "best-city-to-live-in-your-20s",
    name: "Best City to Live in Your 20s",
    description: "Which US city is the best place to spend your twenties?",
    items: [
      "New York City", "Los Angeles", "Chicago", "Austin", "Denver",
      "Nashville", "Miami", "San Francisco", "Seattle", "Portland",
      "Boston", "San Diego", "Atlanta", "Philadelphia", "Washington DC",
      "Dallas", "Houston", "Minneapolis", "Charlotte", "Raleigh",
      "Tampa", "Phoenix", "Salt Lake City", "New Orleans", "Pittsburgh",
      "Detroit", "Columbus", "Indianapolis", "Milwaukee", "Kansas City",
      "St. Louis", "Baltimore", "Richmond", "Sacramento", "Las Vegas",
      "Orlando", "Jacksonville", "Cincinnati", "Louisville", "San Antonio",
      "Oakland", "Honolulu", "Boise", "Asheville", "Burlington",
      "Madison", "Savannah", "Charleston", "Boulder", "Ann Arbor",
    ],
  },
  {
    slug: "best-nba-player-right-now",
    name: "Best NBA Player Right Now",
    description: "Who's the best player in the NBA today? Vote head-to-head.",
    items: [
      "Nikola Joki\u0107", "Luka Don\u010di\u0107", "Shai Gilgeous-Alexander", "Giannis Antetokounmpo", "Jayson Tatum",
      "Anthony Edwards", "LeBron James", "Stephen Curry", "Kevin Durant", "Joel Embiid",
      "Jaylen Brown", "Tyrese Haliburton", "Donovan Mitchell", "Trae Young", "De'Aaron Fox",
      "Paolo Banchero", "Anthony Davis", "Devin Booker", "Damian Lillard", "Ja Morant",
      "Bam Adebayo", "Domantas Sabonis", "LaMelo Ball", "Kyrie Irving", "Jimmy Butler",
      "Paul George", "Kawhi Leonard", "Zion Williamson", "Karl-Anthony Towns", "Chet Holmgren",
      "Victor Wembanyama", "Scottie Barnes", "Pascal Siakam", "Lauri Markkanen", "Franz Wagner",
      "Evan Mobley", "Jaren Jackson Jr.", "Jalen Brunson", "DeMar DeRozan", "James Harden",
      "Brandon Ingram", "Mikal Bridges", "Desmond Bane", "Tyler Herro", "Alperen Seng\u00fcn",
      "Tyrese Maxey", "Anfernee Simons", "Derrick White", "Jalen Williams", "OG Anunoby",
    ],
  },
  {
    slug: "best-airport-in-the-us",
    name: "Best Airport in the US",
    description: "Rank America's airports \u2014 from best to worst.",
    items: [
      "Hartsfield-Jackson Atlanta (ATL)", "Los Angeles (LAX)", "O'Hare Chicago (ORD)",
      "Dallas/Fort Worth (DFW)", "Denver (DEN)", "John F. Kennedy New York (JFK)",
      "San Francisco (SFO)", "Seattle-Tacoma (SEA)", "Orlando (MCO)",
      "Las Vegas Harry Reid (LAS)", "Charlotte Douglas (CLT)", "Newark Liberty (EWR)",
      "Phoenix Sky Harbor (PHX)", "Miami (MIA)", "Houston George Bush (IAH)",
      "Minneapolis-Saint Paul (MSP)", "Detroit Metro (DTW)", "Fort Lauderdale (FLL)",
      "Boston Logan (BOS)", "LaGuardia New York (LGA)", "Philadelphia (PHL)",
      "Salt Lake City (SLC)", "Ronald Reagan Washington (DCA)", "San Diego (SAN)",
      "Tampa (TPA)", "Portland (PDX)", "Nashville (BNA)",
      "Austin-Bergstrom (AUS)", "Raleigh-Durham (RDU)", "Dulles Washington (IAD)",
      "Hobby Houston (HOU)", "Oakland (OAK)", "San Jose (SJC)",
      "Indianapolis (IND)", "Milwaukee (MKE)", "Sacramento (SMF)",
      "Kansas City (MCI)", "Pittsburgh (PIT)", "St. Louis Lambert (STL)",
      "John Wayne Orange County (SNA)", "Cincinnati (CVG)", "Midway Chicago (MDW)",
      "New Orleans (MSY)", "Burbank (BUR)", "Cleveland Hopkins (CLE)",
      "Columbus (CMH)", "Buffalo Niagara (BUF)", "Boise (BOI)",
      "Louisville (SDF)", "Charleston (CHS)",
    ],
  },
  {
    slug: "worst-first-date-spot",
    name: "Worst First Date Spot",
    description: "What's the absolute worst place to take someone on a first date?",
    items: [
      "Movie theater", "Fast food restaurant", "Your parents' house", "A funeral", "The DMV",
      "Walmart", "A gym", "The dentist", "An ex's party", "A work meeting",
      "Chuck E. Cheese", "A hospital waiting room", "A timeshare presentation", "The airport", "An escape room with strangers",
      "A political rally", "Your therapist's office", "A laundromat", "A buffet", "An all-you-can-eat crab boil",
      "A haunted house", "A car dealership", "IKEA", "A cemetery", "A nudist beach",
      "A courtroom", "A gas station", "A pawn shop", "A drive-through car wash", "A dog park (no dog)",
      "A CrossFit class", "A storage unit", "A bowling alley league night", "A MLM pitch meeting", "A bus station",
      "A flea market", "A protest", "A casino", "A public pool", "A poetry open mic",
      "A library", "A parking garage", "A corn maze", "A swap meet", "A karaoke bar alone",
      "A taxidermy shop", "A bingo hall", "A megachurch service", "A spelling bee", "An HR seminar",
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildItemRows(topicId: string, items: string[]) {
  const usedSlugs = new Set<string>();
  return items.map((name) => {
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
  console.log(`Seeding ${FORUMS.length} new forums...\n`);

  for (const forum of FORUMS) {
    // Check if topic already exists
    const { data: existing } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", forum.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  \u2713 "${forum.slug}" already exists \u2014 skipping.`);
      continue;
    }

    // Insert topic
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .insert({
        slug: forum.slug,
        name: forum.name,
        description: forum.description,
        is_public: true,
        is_system: false,
        owner_id: null,
        leaderboard_unlock_votes: 10,
      })
      .select("id, slug")
      .single();

    if (topicError || !topic) {
      console.error(`  \u2717 Failed to create "${forum.slug}":`, topicError?.message);
      process.exit(1);
    }

    // Insert items
    const itemRows = buildItemRows(topic.id, forum.items);
    const { error: itemsError } = await supabase
      .from("topic_items")
      .insert(itemRows);

    if (itemsError) {
      console.error(`  \u2717 Failed to insert items for "${forum.slug}":`, itemsError.message);
      await supabase.from("topics").delete().eq("id", topic.id);
      process.exit(1);
    }

    console.log(`  \u2713 Created "${forum.slug}" with ${itemRows.length} items.`);
  }

  console.log("\nDone!");
}

seed();
