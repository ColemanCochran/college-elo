-- ── Migration 015: Add topic_group column ────────────────────────────────────
--
-- Adds a nullable `topic_group` column to topics so that system topics can
-- be organized into separate groups (e.g., college-rankings, coachella-2026).
-- Each group gets its own selector dropdown on the voting page and its own
-- featured card on the homepage.
--
-- Backfills existing system topics into the "college-rankings" group.

alter table topics
  add column if not exists topic_group text;

-- Backfill all existing system topics into the college-rankings group
update topics
  set topic_group = 'college-rankings'
  where is_system = true
    and topic_group is null;
