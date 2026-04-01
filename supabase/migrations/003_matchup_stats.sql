-- Tracks aggregate outcomes for every pair of colleges ever shown together.
-- college_a_id is always the lexicographically smaller UUID (canonical ordering).

create table if not exists matchup_stats (
  id            uuid primary key default gen_random_uuid(),
  college_a_id  uuid not null,
  college_b_id  uuid not null,
  a_wins        integer not null default 0,
  b_wins        integer not null default 0,
  skips         integer not null default 0,
  appearances   integer not null default 0,
  constraint fk_matchup_a foreign key (college_a_id) references colleges(id) on delete cascade,
  constraint fk_matchup_b foreign key (college_b_id) references colleges(id) on delete cascade,
  constraint canonical_order check (college_a_id < college_b_id),
  constraint unique_pair unique (college_a_id, college_b_id)
);

create index if not exists idx_matchup_stats_a on matchup_stats (college_a_id);
create index if not exists idx_matchup_stats_b on matchup_stats (college_b_id);
create index if not exists idx_matchup_stats_appearances on matchup_stats (appearances desc);

-- Atomic upsert for a vote outcome
create or replace function record_matchup_vote(
  p_college_a_id uuid,
  p_college_b_id uuid,
  p_winner_id    uuid
) returns void as $$
begin
  insert into matchup_stats (college_a_id, college_b_id, a_wins, b_wins, skips, appearances)
  values (
    p_college_a_id,
    p_college_b_id,
    case when p_winner_id = p_college_a_id then 1 else 0 end,
    case when p_winner_id = p_college_b_id then 1 else 0 end,
    0,
    1
  )
  on conflict (college_a_id, college_b_id) do update set
    a_wins      = matchup_stats.a_wins + case when p_winner_id = p_college_a_id then 1 else 0 end,
    b_wins      = matchup_stats.b_wins + case when p_winner_id = p_college_b_id then 1 else 0 end,
    appearances = matchup_stats.appearances + 1;
end;
$$ language plpgsql security definer;

-- Atomic upsert for a skip outcome
create or replace function record_matchup_skip(
  p_college_a_id uuid,
  p_college_b_id uuid
) returns void as $$
begin
  insert into matchup_stats (college_a_id, college_b_id, a_wins, b_wins, skips, appearances)
  values (p_college_a_id, p_college_b_id, 0, 0, 1, 1)
  on conflict (college_a_id, college_b_id) do update set
    skips       = matchup_stats.skips + 1,
    appearances = matchup_stats.appearances + 1;
end;
$$ language plpgsql security definer;

-- RLS
alter table matchup_stats enable row level security;

create policy "matchup_stats_select_all" on matchup_stats
  for select using (true);
