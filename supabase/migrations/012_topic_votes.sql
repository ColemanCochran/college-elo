-- ── Migration 012: topic_votes + topic_matchup_stats ─────────────────────────
--
-- Parallel voting infrastructure for topic_items-based topics.
-- The legacy votes + matchup_stats tables are untouched and continue to serve
-- the existing college-based voting flow.
--
-- topic_votes      — one row per cast vote between two topic_items
-- topic_matchup_stats — aggregate win/loss/skip/appearance counts per pair
--
-- Two SECURITY DEFINER RPC functions mirror the existing record_matchup_vote /
-- record_matchup_skip pattern so server actions have a clean upsert interface.
--
-- Safe: new tables and functions, no existing objects modified.

-- ── topic_votes ───────────────────────────────────────────────────────────────

create table if not exists topic_votes (
  id             uuid        primary key default gen_random_uuid(),
  topic_id       uuid        not null references topics(id)       on delete cascade,
  winner_item_id uuid        not null references topic_items(id)  on delete cascade,
  loser_item_id  uuid        not null references topic_items(id)  on delete cascade,
  ip_hash        text,
  session_id     text,
  voter_id       uuid        references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint topic_votes_different_items check (winner_item_id <> loser_item_id)
);

create index if not exists idx_topic_votes_topic   on topic_votes (topic_id);
create index if not exists idx_topic_votes_winner  on topic_votes (winner_item_id);
create index if not exists idx_topic_votes_loser   on topic_votes (loser_item_id);
create index if not exists idx_topic_votes_ip      on topic_votes (ip_hash, created_at) where ip_hash is not null;
create index if not exists idx_topic_votes_created on topic_votes (created_at desc);

-- ── topic_matchup_stats ───────────────────────────────────────────────────────

create table if not exists topic_matchup_stats (
  id          uuid    primary key default gen_random_uuid(),
  topic_id    uuid    not null references topics(id)      on delete cascade,
  item_a_id   uuid    not null references topic_items(id) on delete cascade,
  item_b_id   uuid    not null references topic_items(id) on delete cascade,
  a_wins      integer not null default 0,
  b_wins      integer not null default 0,
  skips       integer not null default 0,
  appearances integer not null default 0,
  constraint topic_matchup_canonical check (item_a_id < item_b_id),
  constraint topic_matchup_unique    unique (topic_id, item_a_id, item_b_id)
);

create index if not exists idx_topic_matchup_topic on topic_matchup_stats (topic_id);
create index if not exists idx_topic_matchup_appearances on topic_matchup_stats (topic_id, appearances desc);

-- ── RPC: record_topic_item_vote ───────────────────────────────────────────────

create or replace function record_topic_item_vote(
  p_topic_id   uuid,
  p_item_a_id  uuid,
  p_item_b_id  uuid,
  p_winner_id  uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a uuid := least(p_item_a_id, p_item_b_id);
  v_b uuid := greatest(p_item_a_id, p_item_b_id);
begin
  insert into topic_matchup_stats (topic_id, item_a_id, item_b_id, a_wins, b_wins, appearances)
  values (
    p_topic_id,
    v_a,
    v_b,
    case when p_winner_id = v_a then 1 else 0 end,
    case when p_winner_id = v_b then 1 else 0 end,
    1
  )
  on conflict (topic_id, item_a_id, item_b_id) do update set
    a_wins      = topic_matchup_stats.a_wins      + case when p_winner_id = v_a then 1 else 0 end,
    b_wins      = topic_matchup_stats.b_wins      + case when p_winner_id = v_b then 1 else 0 end,
    appearances = topic_matchup_stats.appearances + 1;
end;
$$;

-- ── RPC: record_topic_item_skip ───────────────────────────────────────────────

create or replace function record_topic_item_skip(
  p_topic_id   uuid,
  p_item_a_id  uuid,
  p_item_b_id  uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a uuid := least(p_item_a_id, p_item_b_id);
  v_b uuid := greatest(p_item_a_id, p_item_b_id);
begin
  insert into topic_matchup_stats (topic_id, item_a_id, item_b_id, skips, appearances)
  values (p_topic_id, v_a, v_b, 1, 1)
  on conflict (topic_id, item_a_id, item_b_id) do update set
    skips       = topic_matchup_stats.skips       + 1,
    appearances = topic_matchup_stats.appearances + 1;
end;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table topic_votes enable row level security;

-- Votes are write-only via service_role; no direct reads by anon users.
create policy "topic_votes_service_only"
  on topic_votes for all
  using  (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

alter table topic_matchup_stats enable row level security;

-- Aggregate stats are public (used by head-to-head UI).
create policy "topic_matchup_stats_select_public"
  on topic_matchup_stats for select using (true);

create policy "topic_matchup_stats_write_service_only"
  on topic_matchup_stats for all
  using  (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
