-- Topic-based rankings
-- Adds: topics table, elo_ratings table (per-college per-topic ELO)
-- Migrates existing overall ratings into the new schema
-- Adds topic_id to votes for analytics

-- ── Topics lookup ──────────────────────────────────────────────────────────

create table if not exists topics (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

insert into topics (slug, name, description) values
  ('overall',           'Overall',           'General college prestige and reputation'),
  ('computer-science',  'Computer Science',  'CS programs, research output, and tech placements'),
  ('business',          'Business',          'Undergraduate business and MBA programs'),
  ('engineering',       'Engineering',       'Engineering programs across all disciplines'),
  ('biology',           'Biology',           'Life sciences, pre-med, and research programs'),
  ('psychology',        'Psychology',        'Psychology research and clinical training'),
  ('economics',         'Economics',         'Economics programs and career outcomes'),
  ('political-science', 'Political Science', 'Political science and public policy programs'),
  ('communications',    'Communications',    'Journalism, media, and communications programs'),
  ('mathematics',       'Mathematics',       'Math programs and research strength'),
  ('post-grad-success', 'Post-Grad Success', 'Career outcomes, salaries, and placement rates'),
  ('quality-of-life',   'Quality of Life',   'Campus experience, location, and student life')
on conflict (slug) do nothing;

-- ── Per-college, per-topic ELO ratings ────────────────────────────────────

create table if not exists elo_ratings (
  id             uuid primary key default gen_random_uuid(),
  college_id     uuid not null references colleges(id) on delete cascade,
  topic_id       uuid not null references topics(id)   on delete cascade,
  rating         integer not null default 1500,
  wins           integer not null default 0,
  losses         integer not null default 0,
  matches_played integer not null default 0,
  updated_at     timestamptz not null default now(),
  constraint unique_college_topic unique (college_id, topic_id)
);

create index if not exists idx_elo_ratings_college on elo_ratings (college_id);
create index if not exists idx_elo_ratings_topic   on elo_ratings (topic_id);
create index if not exists idx_elo_ratings_rank    on elo_ratings (topic_id, rating desc);

drop trigger if exists elo_ratings_updated_at on elo_ratings;
create trigger elo_ratings_updated_at
  before update on elo_ratings
  for each row execute function update_updated_at();

-- ── Migrate existing Overall ratings from colleges ─────────────────────────

insert into elo_ratings (college_id, topic_id, rating, wins, losses, matches_played)
select c.id, t.id, c.elo_rating, c.wins, c.losses, c.comparisons
from   colleges c
cross  join topics t
where  t.slug = 'overall'
on conflict (college_id, topic_id) do nothing;

-- Seed all other topics at 1500 / 0 / 0 / 0 for every college
insert into elo_ratings (college_id, topic_id, rating, wins, losses, matches_played)
select c.id, t.id, 1500, 0, 0, 0
from   colleges c
cross  join topics t
where  t.slug != 'overall'
on conflict (college_id, topic_id) do nothing;

-- ── Add topic_id to votes ──────────────────────────────────────────────────

alter table votes add column if not exists topic_id uuid references topics(id);

update votes
set    topic_id = (select id from topics where slug = 'overall')
where  topic_id is null;

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table topics      enable row level security;
alter table elo_ratings enable row level security;

create policy "topics_select_all"          on topics      for select using (true);
create policy "elo_ratings_select_all"     on elo_ratings for select using (true);
create policy "elo_ratings_update_service" on elo_ratings for update using (true);
create policy "elo_ratings_insert_service" on elo_ratings for insert with check (true);
