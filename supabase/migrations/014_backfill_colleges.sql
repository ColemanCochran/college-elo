-- ── Migration 014: Backfill — "Most Prestigious Colleges" seeded topic ────────
--
-- Creates the first user-facing topic under the new schema and bulk-copies
-- all college rows into topic_items, preserving live ELO data.
--
-- ELO source: elo_ratings table, overall topic  (most authoritative)
-- Comparisons / skips source: colleges table    (elo_ratings has matches_played
--   but comparisons and skips are only on colleges)
--
-- legacy_college_id is populated so verification queries can JOIN back to
-- the original colleges rows.
--
-- The entire operation is wrapped in a single transaction with explicit
-- row-count assertions.  If any assertion fails the whole block rolls back
-- and the production database is left unchanged.
--
-- Safe: new topic row + new topic_items rows only.  colleges, elo_ratings,
-- votes, and matchup_stats are never read-modified or deleted.

do $$
declare
  v_topic_id         uuid;
  v_overall_topic_id uuid;
  v_college_count    bigint;
  v_item_count       bigint;
  v_elo_sum_colleges numeric;
  v_elo_sum_items    numeric;
begin

  -- ── 1. Resolve the existing "overall" topic so we can pull its ELO data ────

  select id into v_overall_topic_id
  from topics
  where slug = 'overall';

  if v_overall_topic_id is null then
    raise exception 'overall topic not found — run migration 004 first';
  end if;

  -- ── 2. Insert the new seeded topic (idempotent via ON CONFLICT DO NOTHING) ──

  insert into topics (
    slug,
    name,
    description,
    is_public,
    is_system,
    leaderboard_unlock_votes,
    owner_id
  )
  values (
    'most-prestigious-colleges',
    'Most Prestigious Colleges',
    'Rank US colleges and universities by overall prestige and reputation. Ratings are seeded from cumulative community votes.',
    true,
    true,
    10,
    null          -- system topics have no individual owner
  )
  on conflict (slug) do nothing;

  select id into v_topic_id
  from topics
  where slug = 'most-prestigious-colleges';

  -- ── 3. Bulk-copy colleges into topic_items ───────────────────────────────────
  --
  -- Priority for each field:
  --   elo_rating  → elo_ratings.rating for 'overall' (the live per-topic value)
  --   wins        → elo_ratings.wins   for 'overall'
  --   losses      → elo_ratings.losses for 'overall'
  --   comparisons → colleges.comparisons (elo_ratings has matches_played but
  --                   comparisons is the canonical "times shown" counter)
  --   skips       → colleges.skips
  --   image_url   → colleges.logo_url  (stored as-is; no upload required)

  insert into topic_items (
    topic_id,
    name,
    slug,
    image_url,
    elo_rating,
    comparisons,
    wins,
    losses,
    skips,
    legacy_college_id
  )
  select
    v_topic_id,
    c.name,
    c.slug,
    c.logo_url,
    coalesce(er.rating,  c.elo_rating, 1500)  as elo_rating,
    c.comparisons,
    coalesce(er.wins,    c.wins,       0)     as wins,
    coalesce(er.losses,  c.losses,     0)     as losses,
    c.skips,
    c.id                                       as legacy_college_id
  from colleges c
  left join elo_ratings er
    on  er.college_id = c.id
    and er.topic_id   = v_overall_topic_id
  on conflict (topic_id, slug) do nothing;

  -- ── 4. Verify row-count parity ───────────────────────────────────────────────

  select count(*) into v_college_count from colleges;
  select count(*) into v_item_count
  from topic_items
  where topic_id = v_topic_id;

  if v_item_count <> v_college_count then
    raise exception
      'Row-count mismatch: colleges=% topic_items=% — backfill aborted',
      v_college_count, v_item_count;
  end if;

  -- ── 5. Verify ELO sum parity ─────────────────────────────────────────────────
  --
  -- Sum of ELO ratings should match between the elo_ratings rows for "overall"
  -- and the freshly inserted topic_items rows.

  select coalesce(sum(rating), 0) into v_elo_sum_colleges
  from elo_ratings
  where topic_id = v_overall_topic_id;

  select coalesce(sum(elo_rating), 0) into v_elo_sum_items
  from topic_items
  where topic_id = v_topic_id;

  if v_elo_sum_colleges <> v_elo_sum_items then
    raise exception
      'ELO sum mismatch: elo_ratings(overall)=% topic_items=% — backfill aborted',
      v_elo_sum_colleges, v_elo_sum_items;
  end if;

  raise notice 'Backfill complete: % items inserted, ELO sum = %',
    v_item_count, v_elo_sum_items;

end;
$$;
