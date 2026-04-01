/**
 * Seed script — run with: npx tsx scripts/seed.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
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

const colleges = [
  { name: "Harvard University", slug: "harvard", logo_url: "https://upload.wikimedia.org/wikipedia/en/2/29/Harvard_shield_wreath.svg" },
  { name: "Stanford University", slug: "stanford", logo_url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Stanford_Cardinal_logo.svg" },
  { name: "Massachusetts Institute of Technology", slug: "mit", logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg" },
  { name: "Princeton University", slug: "princeton", logo_url: "https://upload.wikimedia.org/wikipedia/en/7/75/Princeton_shield.svg" },
  { name: "Yale University", slug: "yale", logo_url: "https://upload.wikimedia.org/wikipedia/en/0/07/Yale_Bulldogs_logo.svg" },
  { name: "Columbia University", slug: "columbia", logo_url: "https://upload.wikimedia.org/wikipedia/en/9/9b/Columbia_Lions_logo.svg" },
  { name: "University of Chicago", slug: "uchicago", logo_url: "https://upload.wikimedia.org/wikipedia/en/2/25/UChicago_Maroons_logo.svg" },
  { name: "University of Pennsylvania", slug: "upenn", logo_url: "https://upload.wikimedia.org/wikipedia/en/9/9e/UPenn_Quakers_logo.svg" },
  { name: "Duke University", slug: "duke", logo_url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Duke_Athletics_logo.svg" },
  { name: "Northwestern University", slug: "northwestern", logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Northwestern_Wildcats_logo.svg" },
  { name: "Johns Hopkins University", slug: "johns-hopkins", logo_url: "https://upload.wikimedia.org/wikipedia/en/b/b4/Johns_Hopkins_Blue_Jays_logo.svg" },
  { name: "Dartmouth College", slug: "dartmouth", logo_url: "https://upload.wikimedia.org/wikipedia/en/b/bb/Dartmouth_Big_Green_logo.svg" },
  { name: "Brown University", slug: "brown", logo_url: "https://upload.wikimedia.org/wikipedia/en/8/84/Brown_Bears_logo.svg" },
  { name: "Cornell University", slug: "cornell", logo_url: "https://upload.wikimedia.org/wikipedia/en/4/47/Cornell_Big_Red_logo.svg" },
  { name: "Rice University", slug: "rice", logo_url: "https://upload.wikimedia.org/wikipedia/en/9/9a/Rice_Owls_logo.svg" },
  { name: "Vanderbilt University", slug: "vanderbilt", logo_url: "https://upload.wikimedia.org/wikipedia/en/7/71/Vanderbilt_Commodores_logo.svg" },
  { name: "University of Notre Dame", slug: "notre-dame", logo_url: "https://upload.wikimedia.org/wikipedia/en/a/a5/Notre_Dame_Fighting_Irish_logo.svg" },
  { name: "Georgetown University", slug: "georgetown", logo_url: "https://upload.wikimedia.org/wikipedia/en/7/7e/Georgetown_Hoyas_logo.svg" },
  { name: "Emory University", slug: "emory", logo_url: "https://upload.wikimedia.org/wikipedia/en/8/8a/Emory_Eagles_logo.svg" },
  { name: "Washington University in St. Louis", slug: "washu", logo_url: "https://upload.wikimedia.org/wikipedia/en/6/6c/WashU_Bears_logo.svg" },
  { name: "Tufts University", slug: "tufts", logo_url: "https://upload.wikimedia.org/wikipedia/en/2/2d/Tufts_Jumbos_logo.svg" },
  { name: "Carnegie Mellon University", slug: "cmu", logo_url: "https://upload.wikimedia.org/wikipedia/en/b/bb/Carnegie_Mellon_Tartans_logo.svg" },
  { name: "University of California, Berkeley", slug: "uc-berkeley", logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Cal_Golden_Bears_logo.svg" },
  { name: "University of California, Los Angeles", slug: "ucla", logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/0d/UCLA_Bruins_logo.svg" },
  { name: "University of Michigan", slug: "umich", logo_url: "https://upload.wikimedia.org/wikipedia/en/2/21/Michigan_Wolverines_logo.svg" },
  { name: "University of Virginia", slug: "uva", logo_url: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Virginia_Cavaliers_sabre.svg" },
  { name: "University of North Carolina at Chapel Hill", slug: "unc", logo_url: "https://upload.wikimedia.org/wikipedia/en/6/6d/North_Carolina_Tar_Heels_logo.svg" },
  { name: "University of Southern California", slug: "usc", logo_url: "https://upload.wikimedia.org/wikipedia/commons/5/5f/USC_Trojans_logo.svg" },
  { name: "University of California, San Diego", slug: "ucsd", logo_url: "https://upload.wikimedia.org/wikipedia/en/7/73/UC_San_Diego_Tritons_logo.svg" },
  { name: "University of California, Davis", slug: "uc-davis", logo_url: "https://upload.wikimedia.org/wikipedia/en/c/c8/UC_Davis_Aggies_logo.svg" },
  { name: "University of Texas at Austin", slug: "ut-austin", logo_url: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Texas_Longhorns_logo.svg" },
  { name: "Georgia Institute of Technology", slug: "gatech", logo_url: "https://upload.wikimedia.org/wikipedia/en/8/8d/Georgia_Tech_Yellow_Jackets_logo.svg" },
  { name: "University of Wisconsin-Madison", slug: "uw-madison", logo_url: "https://upload.wikimedia.org/wikipedia/en/d/d8/Wisconsin_Badgers_logo.svg" },
  { name: "University of Illinois Urbana-Champaign", slug: "uiuc", logo_url: "https://upload.wikimedia.org/wikipedia/en/5/59/Illinois_Fighting_Illini_logo.svg" },
  { name: "Purdue University", slug: "purdue", logo_url: "https://upload.wikimedia.org/wikipedia/en/2/23/Purdue_Boilermakers_logo.svg" },
  { name: "Penn State University", slug: "penn-state", logo_url: "https://upload.wikimedia.org/wikipedia/en/d/d0/Penn_State_Nittany_Lions_logo.svg" },
  { name: "Ohio State University", slug: "ohio-state", logo_url: "https://upload.wikimedia.org/wikipedia/en/e/e8/Ohio_State_Buckeyes_logo.svg" },
  { name: "University of Washington", slug: "uw-seattle", logo_url: "https://upload.wikimedia.org/wikipedia/en/b/b8/Washington_Huskies_logo.svg" },
  { name: "Boston University", slug: "bu", logo_url: "https://upload.wikimedia.org/wikipedia/en/7/72/Boston_University_Terriers_logo.svg" },
  { name: "Northeastern University", slug: "northeastern", logo_url: "https://upload.wikimedia.org/wikipedia/en/8/89/Northeastern_Huskies_logo.svg" },
  { name: "Tulane University", slug: "tulane", logo_url: "https://upload.wikimedia.org/wikipedia/en/c/ce/Tulane_Green_Wave_logo.svg" },
  { name: "Case Western Reserve University", slug: "case-western", logo_url: "https://upload.wikimedia.org/wikipedia/en/9/9b/Case_Western_Reserve_Spartans_logo.svg" },
  { name: "University of Rochester", slug: "rochester", logo_url: "https://upload.wikimedia.org/wikipedia/en/9/9a/Rochester_Yellowjackets_logo.svg" },
  { name: "Wake Forest University", slug: "wake-forest", logo_url: "https://upload.wikimedia.org/wikipedia/en/c/c3/Wake_Forest_Demon_Deacons_logo.svg" },
  { name: "Rensselaer Polytechnic Institute", slug: "rpi", logo_url: "https://upload.wikimedia.org/wikipedia/en/c/c5/RPI_Engineers_logo.svg" },
  { name: "William & Mary", slug: "william-and-mary", logo_url: "https://upload.wikimedia.org/wikipedia/en/8/8a/William_%26_Mary_Tribe_logo.svg" },
  { name: "University of Florida", slug: "uf", logo_url: "https://upload.wikimedia.org/wikipedia/en/1/1d/Florida_Gators_logo.svg" },
  { name: "University of Georgia", slug: "uga", logo_url: "https://upload.wikimedia.org/wikipedia/en/3/3c/Georgia_Bulldogs_logo.svg" },
  { name: "Indiana University Bloomington", slug: "indiana", logo_url: "https://upload.wikimedia.org/wikipedia/en/9/97/Indiana_Hoosiers_logo.svg" },
  { name: "University of Minnesota", slug: "umn", logo_url: "https://upload.wikimedia.org/wikipedia/en/1/18/Minnesota_Golden_Gophers_logo.svg" },
];

async function seed() {
  console.log(`Seeding ${colleges.length} colleges...`);

  const rows = colleges.map((c) => ({
    ...c,
    elo_rating: 1500,
    comparisons: 0,
    wins: 0,
    losses: 0,
  }));

  const { data, error } = await supabase
    .from("colleges")
    .upsert(rows, { onConflict: "slug" })
    .select("name");

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`✓ Seeded ${data?.length ?? 0} colleges successfully.`);
}

seed();
