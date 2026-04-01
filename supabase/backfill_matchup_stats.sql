-- Backfill matchup_stats from all existing votes.
-- Run this once in Supabase SQL Editor after applying migration 003.
-- Safe to re-run — uses ON CONFLICT to overwrite with correct totals.

insert into matchup_stats (college_a_id, college_b_id, a_wins, b_wins, skips, appearances)
select
  least(winner_college_id, loser_college_id)    as college_a_id,
  greatest(winner_college_id, loser_college_id) as college_b_id,
  sum(case when winner_college_id < loser_college_id then 1 else 0 end) as a_wins,
  sum(case when winner_college_id > loser_college_id then 1 else 0 end) as b_wins,
  0                                              as skips,
  count(*)                                       as appearances
from votes
group by
  least(winner_college_id, loser_college_id),
  greatest(winner_college_id, loser_college_id)
on conflict (college_a_id, college_b_id) do update set
  a_wins      = excluded.a_wins,
  b_wins      = excluded.b_wins,
  appearances = excluded.appearances;
