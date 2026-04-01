-- CollegeRank initial schema

create extension if not exists "pgcrypto";

-- Colleges table
create table if not exists colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  elo_rating integer not null default 1500,
  comparisons integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_colleges_elo on colleges (elo_rating desc);
create index if not exists idx_colleges_comparisons on colleges (comparisons asc);

-- Votes table
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  winner_college_id uuid not null references colleges(id) on delete cascade,
  loser_college_id uuid not null references colleges(id) on delete cascade,
  ip_hash text,
  session_id text,
  created_at timestamptz not null default now(),
  constraint different_colleges check (winner_college_id <> loser_college_id)
);

create index if not exists idx_votes_winner on votes (winner_college_id);
create index if not exists idx_votes_loser on votes (loser_college_id);
create index if not exists idx_votes_session on votes (session_id);
create index if not exists idx_votes_created_at on votes (created_at desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists colleges_updated_at on colleges;
create trigger colleges_updated_at
  before update on colleges
  for each row execute function update_updated_at();

-- Row Level Security
alter table colleges enable row level security;
alter table votes enable row level security;

-- Anyone can read colleges
create policy "colleges_select_all" on colleges
  for select using (true);

-- Only service role can update colleges (via server actions)
create policy "colleges_update_service" on colleges
  for update using (true);

-- Anyone can insert votes (server-side only)
create policy "votes_insert_all" on votes
  for insert with check (true);

-- Anyone can read votes
create policy "votes_select_all" on votes
  for select using (true);
