# CollegeRank

ELO-based college prestige ranking site. Community votes determine which colleges rise and fall.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (Postgres + Row Level Security)
- **Vercel** (deployment)

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd college_elo
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   - `supabase/migrations/001_initial.sql` — creates schema + RLS policies
   - `supabase/seed.sql` — seeds 50 colleges at ELO 1500

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in your Supabase URL and anon key from **Project Settings → API**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Seed via script (alternative to SQL editor)

```bash
# Add SUPABASE_SERVICE_ROLE_KEY to .env.local first
npx tsx scripts/seed.ts
```

---

## ELO Tests

```bash
npx tsx lib/elo.test.ts
```

---

## Deploy to Vercel

### Option A: Vercel Dashboard
1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Option B: Vercel CLI
```bash
npx vercel
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel --prod
```

---

## Project Structure

```
app/
  page.tsx              # Voting / matchup page (SSR)
  leaderboard/
    page.tsx            # Rankings (ISR, revalidates every 60s)
  actions/
    vote.ts             # Server action: submit vote + return next matchup
components/
  CollegeCard.tsx       # Individual college vote card
  MatchupVoting.tsx     # Client-side voting UI with keyboard support
  LeaderboardTable.tsx  # Sortable/searchable rankings table
  EloExplainer.tsx      # How ELO works section
lib/
  elo.ts                # ELO calculation utilities
  elo.test.ts           # ELO unit tests
  matchmaking.ts        # Matchup generation algorithm
  supabase-server.ts    # Server-side Supabase client
  supabase-client.ts    # Browser Supabase client
types/
  index.ts              # TypeScript types
supabase/
  migrations/
    001_initial.sql     # Schema + RLS policies
  seed.sql              # 50 college seed data
scripts/
  seed.ts               # Programmatic seed script
```

---

## ELO System

| Setting | Value |
|---------|-------|
| Default rating | 1500 |
| K-factor | 32 |
| Expected score | `1 / (1 + 10^((Rb - Ra) / 400))` |

## Matchmaking Algorithm

- **70%** smart pairing: least-compared college paired with a similar-ELO opponent
- **30%** random: occasional exploration to surface surprising preferences
- Never repeats the exact same matchup back-to-back
- Randomly swaps left/right to prevent side bias

## Anti-Spam

- 500ms minimum between votes per IP (swap for Upstash Redis in production)
- IP addresses are SHA-256 hashed before storage
- All ELO updates happen server-side only

## Scaling Notes

- Replace in-memory rate limiter with **Upstash Redis** (Vercel Marketplace) for distributed deployments
- Add `(elo_rating, comparisons)` composite index as college count grows
- Use **Vercel Edge Config** for feature flags
