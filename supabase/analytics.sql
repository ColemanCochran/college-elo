-- CollegeRank Analytics Queries
-- Run these in Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. Current ELO leaderboard with win rate
-- ============================================================
select
  rank() over (order by elo_rating desc) as rank,
  name,
  elo_rating,
  wins,
  losses,
  comparisons,
  case when comparisons > 0
    then round(wins::numeric / comparisons * 100, 1)
    else 0
  end as win_rate_pct
from colleges
order by elo_rating desc;


-- ============================================================
-- 2. Total votes and activity summary
-- ============================================================
select
  count(*)                                        as total_votes,
  count(distinct session_id)                      as unique_sessions,
  count(distinct ip_hash)                         as unique_ips,
  min(created_at)                                 as first_vote,
  max(created_at)                                 as latest_vote,
  round(count(*) / nullif(count(distinct date(created_at)), 0), 1) as avg_votes_per_day
from votes;


-- ============================================================
-- 3. Votes over time (by day)
-- ============================================================
select
  date(created_at) as day,
  count(*)         as votes
from votes
group by day
order by day desc;


-- ============================================================
-- 4. Most voted-on matchups (top 20)
-- ============================================================
select
  w.name  as winner,
  l.name  as loser,
  count(*) as times_played
from votes v
join colleges w on w.id = v.winner_college_id
join colleges l on l.id = v.loser_college_id
group by w.name, l.name
order by times_played desc
limit 20;


-- ============================================================
-- 5. Biggest upsets — lower-rated school beat higher-rated
--    (approximated by current ELO differential)
-- ============================================================
select
  w.name                        as winner,
  l.name                        as loser,
  l.elo_rating - w.elo_rating   as elo_gap,
  v.created_at
from votes v
join colleges w on w.id = v.winner_college_id
join colleges l on l.id = v.loser_college_id
where l.elo_rating > w.elo_rating
order by elo_gap desc
limit 20;


-- ============================================================
-- 6. Most active sessions (top 10)
-- ============================================================
select
  session_id,
  count(*)        as votes_cast,
  min(created_at) as started,
  max(created_at) as last_vote
from votes
where session_id is not null
group by session_id
order by votes_cast desc
limit 10;


-- ============================================================
-- 7. Schools with the most ELO movement from default (1500)
-- ============================================================
select
  name,
  elo_rating,
  elo_rating - 1500               as elo_delta,
  comparisons
from colleges
order by abs(elo_rating - 1500) desc;


-- ============================================================
-- 8. Head-to-head record between two specific schools
--    (edit the names to whichever matchup you want to check)
-- ============================================================
select
  w.name as winner,
  l.name as loser,
  count(*) as times
from votes v
join colleges w on w.id = v.winner_college_id
join colleges l on l.id = v.loser_college_id
where (w.name = 'Harvard' and l.name = 'MIT')
   or (w.name = 'MIT'     and l.name = 'Harvard')
group by w.name, l.name;
