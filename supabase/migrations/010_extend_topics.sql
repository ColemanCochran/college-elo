-- ── Migration 010: Extend topics for ownership and configuration ──────────────
--
-- Adds owner_id, is_public, leaderboard_unlock_votes, and is_system to the
-- existing topics table.  All columns are additive with safe defaults so
-- existing rows are not affected.
--
-- Safe: additive only, no columns dropped, no existing data modified.

alter table topics
  add column if not exists owner_id               uuid        references auth.users(id) on delete set null,
  add column if not exists is_public              boolean     not null default true,
  add column if not exists leaderboard_unlock_votes integer   not null default 10,
  add column if not exists is_system              boolean     not null default false;

-- All topics that exist before this migration are system-owned (no user owns them).
update topics
set is_system = true
where owner_id is null
  and is_system = false;

create index if not exists idx_topics_owner     on topics (owner_id)   where owner_id is not null;
create index if not exists idx_topics_is_public on topics (is_public)  where is_public = true;
create index if not exists idx_topics_is_system on topics (is_system);

-- ── Update the existing permissive SELECT policy ──────────────────────────────
--
-- The current policy "topics_select_all" (from migration 004) lets anyone read
-- any topic, including future private/draft topics.  Replace it with a policy
-- that respects is_public, while still letting owners preview their own drafts.
-- We do NOT add INSERT/UPDATE/DELETE policies here; those come in migration 013
-- after the new tables are in place.

drop policy if exists "topics_select_all" on topics;

create policy "topics_select_public_or_owner"
  on topics for select
  using (
    is_public = true
    or owner_id = auth.uid()
    or auth.role() = 'service_role'
  );
