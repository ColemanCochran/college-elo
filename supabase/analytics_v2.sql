-- College Clash Analytics — v2
-- Queries the live schema: elo_ratings, topics, votes, matchup_stats
-- Run sections individually in Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. Site-wide activity summary
-- ============================================================
select
  count(*)                                                        as total_votes,
  count(distinct ip_hash)                                         as unique_ips,
  count(distinct session_id)                                      as unique_sessions,
  min(created_at)                                                 as first_vote,
  max(created_at)                                                 as latest_vote,
  extract(epoch from (max(created_at) - min(created_at))) / 86400 as days_active,
  round(count(*) / nullif(count(distinct date(created_at)), 0), 1) as avg_votes_per_day
from votes;


-- ============================================================
-- 2. Votes by day (growth trend)
-- ============================================================
select
  date(created_at)          as day,
  count(*)                  as votes,
  count(distinct ip_hash)   as unique_ips,
  count(distinct session_id) as unique_sessions
from votes
group by day
order by day;


-- ============================================================
-- 3. Votes by topic (topic popularity)
-- ============================================================
select
  t.name                                      as topic,
  count(v.id)                                 as votes,
  round(count(v.id) * 100.0 / sum(count(v.id)) over (), 1) as pct_of_total
from topics t
left join votes v on v.topic_id = t.id
group by t.id, t.name
order by votes desc;


-- ============================================================
-- 4. Overall ELO leaderboard (top 25)
-- ============================================================
select
  rank() over (order by er.rating desc)   as rank,
  c.name,
  er.rating                               as elo,
  er.rating - 1500                        as delta_from_start,
  er.wins,
  er.losses,
  er.matches_played,
  case when er.matches_played > 0
    then round(er.wins::numeric / er.matches_played * 100, 1)
    else 0
  end                                     as win_rate_pct
from elo_ratings er
join colleges c  on c.id  = er.college_id
join topics   t  on t.id  = er.topic_id
where t.slug = 'overall'
order by er.rating desc
limit 25;


-- ============================================================
-- 5. Per-topic leaderboard (top 10 per topic)
-- ============================================================
select
  t.name                                                 as topic,
  rank() over (partition by t.id order by er.rating desc) as rank,
  c.name                                                 as college,
  er.rating                                              as elo,
  er.matches_played
from elo_ratings er
join colleges c on c.id = er.college_id
join topics   t on t.id = er.topic_id
where rank() over (partition by t.id order by er.rating desc) <= 10
order by t.name, rank;

-- (Cleaner version using a subquery)
select topic, rank, college, elo, matches_played
from (
  select
    t.name                                                   as topic,
    rank() over (partition by t.id order by er.rating desc)  as rank,
    c.name                                                   as college,
    er.rating                                                as elo,
    er.matches_played
  from elo_ratings er
  join colleges c on c.id = er.college_id
  join topics   t on t.id = er.topic_id
) ranked
where rank <= 10
order by topic, rank;


-- ============================================================
-- 6. Biggest rank divergences between Overall and each topic
--    Which schools are overrated/underrated in specific topics?
-- ============================================================
with overall_ranks as (
  select
    er.college_id,
    er.rating                                            as overall_elo,
    rank() over (order by er.rating desc)                as overall_rank
  from elo_ratings er
  join topics t on t.id = er.topic_id
  where t.slug = 'overall'
),
topic_ranks as (
  select
    er.college_id,
    t.name                                                   as topic,
    er.rating                                                as topic_elo,
    rank() over (partition by t.id order by er.rating desc)  as topic_rank,
    er.matches_played
  from elo_ratings er
  join topics t on t.id = er.topic_id
  where t.slug != 'overall'
    and er.matches_played >= 10   -- only show schools with enough data
)
select
  c.name                                   as college,
  tr.topic,
  o.overall_rank,
  tr.topic_rank,
  o.overall_rank - tr.topic_rank           as rank_improvement,  -- positive = ranks higher in topic
  o.overall_elo,
  tr.topic_elo
from topic_ranks tr
join overall_ranks o on o.college_id = tr.college_id
join colleges c      on c.id = tr.college_id
order by abs(o.overall_rank - tr.topic_rank) desc
limit 30;


-- ============================================================
-- 7. Most contested matchups (closest head-to-head records)
-- ============================================================
select
  ca.name                                            as college_a,
  cb.name                                            as college_b,
  ms.a_wins,
  ms.b_wins,
  ms.skips,
  ms.appearances,
  abs(ms.a_wins - ms.b_wins)                         as win_margin,
  round(greatest(ms.a_wins, ms.b_wins)::numeric
        / nullif(ms.a_wins + ms.b_wins, 0) * 100, 1) as dominant_side_pct
from matchup_stats ms
join colleges ca on ca.id = ms.college_a_id
join colleges cb on cb.id = ms.college_b_id
where ms.a_wins + ms.b_wins >= 5   -- minimum sample
order by abs(ms.a_wins - ms.b_wins) asc, ms.appearances desc
limit 20;


-- ============================================================
-- 8. Most decisive matchups (one school dominates)
-- ============================================================
select
  ca.name                                            as college_a,
  cb.name                                            as college_b,
  ms.a_wins,
  ms.b_wins,
  ms.appearances,
  round(greatest(ms.a_wins, ms.b_wins)::numeric
        / nullif(ms.a_wins + ms.b_wins, 0) * 100, 1) as dominant_side_pct,
  case when ms.a_wins > ms.b_wins then ca.name else cb.name end as dominant_school
from matchup_stats ms
join colleges ca on ca.id = ms.college_a_id
join colleges cb on cb.id = ms.college_b_id
where ms.a_wins + ms.b_wins >= 5
order by dominant_side_pct desc
limit 20;


-- ============================================================
-- 9. Schools with highest skip rate
--    (users most often skip when these schools appear)
-- ============================================================
select
  c.name,
  c.skips,
  coalesce(
    (select sum(ms.appearances)
     from matchup_stats ms
     where ms.college_a_id = c.id or ms.college_b_id = c.id), 0
  )                                                   as total_appearances,
  case when coalesce(
    (select sum(ms.appearances)
     from matchup_stats ms
     where ms.college_a_id = c.id or ms.college_b_id = c.id), 0
  ) > 0
    then round(c.skips::numeric / (
      select sum(ms.appearances)
      from matchup_stats ms
      where ms.college_a_id = c.id or ms.college_b_id = c.id
    ) * 100, 1)
    else 0
  end                                                 as skip_rate_pct
from colleges c
order by skip_rate_pct desc
limit 20;


-- ============================================================
-- 10. User engagement distribution
--     How many votes does a typical session cast?
-- ============================================================
with session_votes as (
  select
    session_id,
    count(*)                      as votes_cast,
    min(created_at)               as started,
    max(created_at)               as ended,
    extract(epoch from max(created_at) - min(created_at)) as duration_sec
  from votes
  where session_id is not null
  group by session_id
)
select
  count(*)                                      as total_sessions,
  round(avg(votes_cast), 1)                     as avg_votes_per_session,
  percentile_cont(0.5) within group
    (order by votes_cast)                       as median_votes,
  max(votes_cast)                               as max_votes_in_session,
  count(*) filter (where votes_cast = 1)        as one_and_done_sessions,
  count(*) filter (where votes_cast >= 10)      as engaged_sessions_10plus,
  count(*) filter (where votes_cast >= 50)      as power_user_sessions_50plus
from session_votes;


-- ============================================================
-- 11. Votes by hour of day (when are users most active?)
-- ============================================================
select
  extract(hour from created_at at time zone 'America/New_York') as hour_et,
  count(*) as votes
from votes
group by hour_et
order by hour_et;


-- ============================================================
-- 12. Schools that consistently dominate across all topics
--     (average topic rank, min 5 matches per topic)
-- ============================================================
select
  c.name,
  round(avg(ranked.topic_rank), 1)                as avg_rank_across_topics,
  min(ranked.topic_rank)                          as best_topic_rank,
  max(ranked.topic_rank)                          as worst_topic_rank,
  max(ranked.topic_rank) - min(ranked.topic_rank) as rank_range,
  count(distinct ranked.topic)                    as topics_with_data
from (
  select
    er.college_id,
    t.name                                                   as topic,
    rank() over (partition by t.id order by er.rating desc)  as topic_rank
  from elo_ratings er
  join topics t on t.id = er.topic_id
  where t.slug != 'overall'
    and er.matches_played >= 5
) ranked
join colleges c on c.id = ranked.college_id
group by c.name
having count(distinct ranked.topic) >= 3   -- must appear in at least 3 topics
order by avg_rank_across_topics asc
limit 20;


-- ============================================================
-- 13. ELO volatility — which schools' ratings moved the most?
-- ============================================================
select
  c.name,
  t.name                      as topic,
  er.rating                   as current_elo,
  er.rating - 1500            as net_delta,
  er.matches_played,
  er.wins,
  er.losses
from elo_ratings er
join colleges c on c.id = er.college_id
join topics   t on t.id = er.topic_id
where t.slug = 'overall'
order by abs(er.rating - 1500) desc
limit 20;


-- ============================================================
-- 14. Potential bot/spam detection
--     Sessions or IPs with unusually high vote counts
-- ============================================================
select
  ip_hash,
  count(*)                               as total_votes,
  count(distinct session_id)             as sessions_from_ip,
  count(distinct date(created_at))       as active_days,
  min(created_at)                        as first_vote,
  max(created_at)                        as last_vote,
  round(count(*) / nullif(
    extract(epoch from max(created_at) - min(created_at)) / 60, 0
  ), 1)                                  as votes_per_minute_avg
from votes
where ip_hash is not null
group by ip_hash
having count(*) > 50
order by total_votes desc
limit 20;
