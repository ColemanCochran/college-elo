"""
Download Coachella 2026 artist images via MusicBrainz + Wikidata + Wikimedia Commons.

Usage: python3 scripts/download-artist-images.py
"""

import hashlib
import json
import os
import re
import time
import urllib.request
import urllib.parse
import urllib.error

LOGO_DIR = "public/logos"
USER_AGENT = "Duelist/1.0 (colemancochran@gmail.com)"

# All Coachella 2026 artists with their expected slugs
ARTISTS = [
    # Friday
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
    # Saturday
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
    # Sunday
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
]

# For collaborative acts, search for the first artist name
SEARCH_OVERRIDES = {
    "Nine Inch Noize": "Nine Inch Nails",
    "Chlo\u00e9 Caillet x Rossi": "Chlo\u00e9 Caillet",
    "Max Dean x Luke Dean": "Max Dean",
    "Cachirula & Loojan": "Cachirula",
    "Green Velvet \u00d7 AYYBO": "Green Velvet",
    "Armin van Buuren x Adam Beyer": "Armin van Buuren",
    "Carlita x Josh Baker": "Carlita",
    "\u00a5\u00d8U$UK\u20ac \u00a5UK1MAT$U": "Yousuke Yukimatsu",
    "Model/Actriz": "Model/Actriz",
}


def slugify(text):
    s = text.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    return s


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError) as e:
        return None


def search_musicbrainz(artist_name):
    """Search MusicBrainz for an artist and return its MBID."""
    query = urllib.parse.quote(artist_name)
    url = f"https://musicbrainz.org/ws/2/artist/?query=artist:{query}&limit=1&fmt=json"
    data = fetch_json(url)
    if data and data.get("artists"):
        return data["artists"][0].get("id")
    return None


def get_wikidata_id(mbid):
    """Get the Wikidata ID from MusicBrainz relations."""
    url = f"https://musicbrainz.org/ws/2/artist/{mbid}?inc=url-rels&fmt=json"
    data = fetch_json(url)
    if not data:
        return None
    for rel in data.get("relations", []):
        if rel.get("type") == "wikidata":
            resource = rel.get("url", {}).get("resource", "")
            # Extract Q-id from URL like https://www.wikidata.org/wiki/Q34086
            match = re.search(r'(Q\d+)', resource)
            if match:
                return match.group(1)
    return None


def get_image_from_wikidata(qid):
    """Get the Wikimedia Commons image URL from a Wikidata entity."""
    url = f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json"
    data = fetch_json(url)
    if not data:
        return None
    entities = data.get("entities", {})
    entity = list(entities.values())[0] if entities else {}
    claims = entity.get("claims", {})
    # P18 = image property
    p18 = claims.get("P18", [])
    if not p18:
        return None
    filename = p18[0]["mainsnak"]["datavalue"]["value"]
    # Build Wikimedia Commons thumbnail URL
    safe_filename = filename.replace(" ", "_")
    md5 = hashlib.md5(safe_filename.encode()).hexdigest()
    thumb_url = (
        f"https://upload.wikimedia.org/wikipedia/commons/thumb/"
        f"{md5[0]}/{md5[:2]}/{urllib.parse.quote(safe_filename)}/"
        f"300px-{urllib.parse.quote(safe_filename)}"
    )
    return thumb_url


def download_image(url, output_path):
    """Download an image and save it."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            with open(output_path, "wb") as f:
                f.write(content)
            return True
    except Exception:
        return False


def process_artist(name):
    slug = slugify(name)
    outfile = os.path.join(LOGO_DIR, f"{slug}.png")

    # Skip if already exists
    if os.path.exists(outfile):
        print(f"  SKIP {slug} (exists)")
        return True

    search_name = SEARCH_OVERRIDES.get(name, name)

    # Step 1: Search MusicBrainz
    time.sleep(1.1)  # MusicBrainz rate limit: 1 req/sec
    mbid = search_musicbrainz(search_name)
    if not mbid:
        print(f"  MISS {slug} (not found on MusicBrainz)")
        return False

    # Step 2: Get Wikidata ID
    time.sleep(1.1)
    qid = get_wikidata_id(mbid)
    if not qid:
        print(f"  MISS {slug} (no Wikidata link)")
        return False

    # Step 3: Get image from Wikidata
    image_url = get_image_from_wikidata(qid)
    if not image_url:
        print(f"  MISS {slug} (no image on Wikidata)")
        return False

    # Step 4: Download
    tmp_path = outfile + ".tmp"
    if download_image(image_url, tmp_path):
        # Convert to PNG using sips (macOS)
        ret = os.system(f'sips -s format png "{tmp_path}" --out "{outfile}" --resampleWidth 300 >/dev/null 2>&1')
        os.remove(tmp_path) if os.path.exists(tmp_path) else None
        if ret == 0 and os.path.exists(outfile):
            size_kb = os.path.getsize(outfile) // 1024
            print(f"  OK   {slug} ({size_kb}KB)")
            return True
        else:
            print(f"  FAIL {slug} (conversion failed)")
            return False
    else:
        print(f"  FAIL {slug} (download failed)")
        return False


def main():
    os.makedirs(LOGO_DIR, exist_ok=True)

    print(f"Downloading images for {len(ARTISTS)} artists...\n")

    ok = 0
    miss = 0
    skip = 0

    for name in ARTISTS:
        result = process_artist(name)
        if result:
            slug = slugify(name)
            if os.path.exists(os.path.join(LOGO_DIR, f"{slug}.png")):
                # Check if it was a skip or new download
                ok += 1
            else:
                skip += 1
        else:
            miss += 1

    print(f"\nDone! {ok} downloaded/existing, {miss} missing.")
    if miss > 0:
        print("Missing artists will show first-letter fallback on the site.")


if __name__ == "__main__":
    main()
