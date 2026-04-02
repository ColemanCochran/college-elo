-- College Clash — Bot & Spam Detection Queries
-- Run sections individually in Supabase Dashboard > SQL Editor
-- These queries are read-only — nothing is modified.

-- ============================================================
-- 1. High-volume IPs — raw vote counts
--    First pass: any IP with more than 100 votes is worth examining
-- ============================================================
select
  ip_hash,
  count(*)                                as total_votes,
  count(distinct session_id)              as distinct_sessions,
  count(distinct date(created_at))        as active_days,
  count(distinct topic_id)                as topics_voted_on,
  min(created_at)                         as first_vote,
  max(created_at)                         as last_vote
from votes
where ip_hash is not null
group by ip_hash
having count(*) > 100
order by total_votes desc;


-- ============================================================
-- 2. Vote velocity per IP
--    Flags IPs that sustained an impossible voting rate.
--    A real user needs ~2-3 seconds per vote. Under 1/sec is suspicious.
-- ============================================================
select
  ip_hash,
  count(*)                                                         as total_votes,
  round(
    extract(epoch from max(created_at) - min(created_at)), 0
  )                                                                as total_duration_sec,
  round(
    count(*)::numeric / nullif(
      extract(epoch from max(created_at) - min(created_at)), 0
    ), 3
  )                                                                as votes_per_sec,
  min(created_at)                                                  as started,
  max(created_at)                                                  as ended
from votes
where ip_hash is not null
group by ip_hash
having count(*) > 20
   and extract(epoch from max(created_at) - min(created_at)) > 0
order by votes_per_sec desc
limit 30;


-- ============================================================
-- 3. Minimum gap between consecutive votes per IP
--    Bots have mechanical precision — gaps cluster at the same value.
--    Real users are irregular. Gaps under 1.5s (your rate limit floor)
--    should be impossible; any showing up indicate clock skew or bypass.
-- ============================================================
with consecutive as (
  select
    ip_hash,
    created_at,
    lag(created_at) over (partition by ip_hash order by created_at) as prev_vote
  from votes
  where ip_hash is not null
)
select
  ip_hash,
  count(*)                                                      as gap_samples,
  round(min(extract(epoch from created_at - prev_vote)), 2)     as min_gap_sec,
  round(avg(extract(epoch from created_at - prev_vote)), 2)     as avg_gap_sec,
  round(stddev(extract(epoch from created_at - prev_vote)), 2)  as stddev_gap_sec,
  -- low stddev = mechanical/bot-like timing
  round(stddev(extract(epoch from created_at - prev_vote))
        / nullif(avg(extract(epoch from created_at - prev_vote)), 0), 3) as coefficient_of_variation
from consecutive
where prev_vote is not null
group by ip_hash
having count(*) >= 10
order by coefficient_of_variation asc  -- most mechanical at top
limit 30;


-- ============================================================
-- 4. Repeat voting on the same matchup from the same IP
--    Organic users almost never see the same pairing twice.
--    High repeats on a specific pair = targeted manipulation.
-- ============================================================
select
  v.ip_hash,
  ca.name   as college_a,
  cb.name   as college_b,
  count(*)  as times_voted_same_pair
from votes v
join colleges ca on ca.id = v.winner_college_id
join colleges cb on cb.id = v.loser_college_id
where v.ip_hash is not null
group by v.ip_hash, ca.name, cb.name
having count(*) >= 3
order by times_voted_same_pair desc
limit 20;


-- ============================================================
-- 5. Sessions that never skip
--    Real users skip when uncertain. A session with 20+ votes
--    and zero skips is a mild bot signal (combined with other signals).
-- ============================================================
with session_skips as (
  -- skips are tracked separately; count votes per session
  select
    session_id,
    ip_hash,
    count(*) as votes_cast
  from votes
  where session_id is not null
  group by session_id, ip_hash
)
select
  ss.session_id,
  ss.ip_hash,
  ss.votes_cast,
  -- if this session_id appears in skips table we'd flag it; approximated here
  0 as skips  -- skips are on colleges table, not per-session; left for extension
from session_skips ss
where ss.votes_cast >= 20
order by ss.votes_cast desc
limit 30;


-- ============================================================
-- 6. Votes always for the same winner (one-sided bias)
--    A real user has varied preferences. An IP that votes for
--    the same school in >90% of its appearances is suspicious.
-- ============================================================
with ip_votes as (
  select
    v.ip_hash,
    v.winner_college_id,
    c.name         as always_wins,
    count(*)       as times_chosen
  from votes v
  join colleges c on c.id = v.winner_college_id
  where v.ip_hash is not null
  group by v.ip_hash, v.winner_college_id, c.name
),
ip_totals as (
  select ip_hash, count(*) as total_votes
  from votes
  where ip_hash is not null
  group by ip_hash
)
select
  iv.ip_hash,
  iv.always_wins,
  iv.times_chosen,
  it.total_votes,
  round(iv.times_chosen * 100.0 / it.total_votes, 1) as pct_votes_for_this_school
from ip_votes iv
join ip_totals it on it.ip_hash = iv.ip_hash
where it.total_votes >= 15
  and iv.times_chosen * 1.0 / it.total_votes > 0.5
order by pct_votes_for_this_school desc
limit 20;


-- ============================================================
-- 7. Multi-session IPs — one IP, many sessions
--    Bots sometimes rotate session IDs to avoid per-session limits.
--    Legitimate users rarely have more than 2-3 sessions per day.
-- ============================================================
select
  ip_hash,
  count(distinct session_id)             as distinct_sessions,
  count(*)                               as total_votes,
  count(distinct date(created_at))       as active_days,
  round(count(distinct session_id)::numeric
        / nullif(count(distinct date(created_at)), 0), 1) as sessions_per_day
from votes
where ip_hash is not null
group by ip_hash
having count(distinct session_id) >= 3
order by distinct_sessions desc
limit 20;


-- ============================================================
-- 8. Burst detection — votes in any 60-second window per IP
--    Looks for concentrated bursts even within otherwise
--    normal-looking sessions. >10 votes in 60s = scripted.
-- ============================================================
with windowed as (
  select
    ip_hash,
    created_at,
    count(*) over (
      partition by ip_hash
      order by created_at
      range between interval '60 seconds' preceding and current row
    ) as votes_in_last_60s
  from votes
  where ip_hash is not null
)
select
  ip_hash,
  max(votes_in_last_60s)  as peak_votes_in_60s,
  count(*)                as total_votes
from windowed
group by ip_hash
having max(votes_in_last_60s) >= 10
order by peak_votes_in_60s desc
limit 20;


-- ============================================================
-- 9. ELO impact of suspected IPs
--    For any IP flagged by queries above, estimate how much their
--    votes affected specific schools' ratings.
--    Replace 'PASTE_IP_HASH_HERE' with a hash from query 1 or 2.
-- ============================================================
select
  case when v.winner_college_id = c.id then 'win' else 'loss' end as outcome,
  c.name                                                           as college,
  count(*)                                                         as votes_affecting_school
from votes v
join colleges c on c.id = v.winner_college_id or c.id = v.loser_college_id
where v.ip_hash = 'PASTE_IP_HASH_HERE'
group by outcome, c.name
order by votes_affecting_school desc;


-- ============================================================
-- 10. Overall suspicion score (composite view)
--     Combines volume, velocity, and session anomalies into one table.
--     Higher score = more suspicious. Use as a triage starting point.
-- ============================================================
with base as (
  select
    ip_hash,
    count(*)                                                      as total_votes,
    count(distinct session_id)                                    as distinct_sessions,
    count(distinct date(created_at))                              as active_days,
    round(count(*)::numeric
          / nullif(extract(epoch from max(created_at) - min(created_at)), 0), 4)
                                                                  as votes_per_sec
  from votes
  where ip_hash is not null
  group by ip_hash
  having count(*) >= 20
),
gap_stats as (
  select
    ip_hash,
    round(stddev(extract(epoch from created_at - prev_vote))
          / nullif(avg(extract(epoch from created_at - prev_vote)), 0), 3) as cv_gaps
  from (
    select ip_hash, created_at,
           lag(created_at) over (partition by ip_hash order by created_at) as prev_vote
    from votes where ip_hash is not null
  ) t
  where prev_vote is not null
  group by ip_hash
  having count(*) >= 10
)
select
  b.ip_hash,
  b.total_votes,
  b.distinct_sessions,
  b.active_days,
  round(b.votes_per_sec, 4)               as votes_per_sec,
  round(g.cv_gaps, 3)                     as timing_regularity,  -- lower = more mechanical
  -- suspicion score: weighted sum of anomaly signals (0–100 scale)
  least(100, round(
      (case when b.total_votes > 500  then 30
            when b.total_votes > 200  then 20
            when b.total_votes > 100  then 10 else 0 end)
    + (case when b.votes_per_sec > 1.0  then 30
            when b.votes_per_sec > 0.5  then 15
            when b.votes_per_sec > 0.3  then 5 else 0 end)
    + (case when b.distinct_sessions > 10 then 20
            when b.distinct_sessions > 5  then 10 else 0 end)
    + (case when coalesce(g.cv_gaps, 1) < 0.2 then 20
            when coalesce(g.cv_gaps, 1) < 0.5 then 10 else 0 end)
  , 0))                                   as suspicion_score
from base b
left join gap_stats g on g.ip_hash = b.ip_hash
order by suspicion_score desc, b.total_votes desc
limit 30;
