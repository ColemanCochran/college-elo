-- ── Migration 011: topic_items ────────────────────────────────────────────────
--
-- Generalized ranked-item table.  Each row belongs to exactly one topic and
-- carries its own ELO state.  Both system topics (colleges) and future
-- user-created topics use this table.
--
-- image_url is kept nullable as a forward-compatibility stub; no upload
-- logic is implemented in this phase.
--
-- legacy_college_id is a nullable back-reference to the colleges table used
-- during backfill verification.  It is set to NULL for all items that are not
-- derived from a college row.
--
-- Safe: new table, no existing tables touched.

create table if not exists topic_items (
  id                uuid        primary key default gen_random_uuid(),
  topic_id          uuid        not null references topics(id) on delete cascade,
  name              text        not null,
  slug              text        not null,
  image_url         text,                         -- reserved for future; not used in MVP
  elo_rating        integer     not null default 1500,
  comparisons       integer     not null default 0,
  wins              integer     not null default 0,
  losses            integer     not null default 0,
  skips             integer     not null default 0,
  legacy_college_id uuid        references colleges(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint topic_items_unique_slug unique (topic_id, slug)
);

create index if not exists idx_topic_items_topic       on topic_items (topic_id);
create index if not exists idx_topic_items_elo         on topic_items (topic_id, elo_rating desc);
create index if not exists idx_topic_items_comparisons on topic_items (topic_id, comparisons asc);
create index if not exists idx_topic_items_legacy      on topic_items (legacy_college_id) where legacy_college_id is not null;

drop trigger if exists topic_items_updated_at on topic_items;
create trigger topic_items_updated_at
  before update on topic_items
  for each row execute function update_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table topic_items enable row level security;

-- Anyone can read items from public topics.
create policy "topic_items_select_public"
  on topic_items for select
  using (
    exists (
      select 1 from topics t
      where t.id = topic_id
        and (t.is_public = true or t.owner_id = auth.uid())
    )
  );

-- All writes go through the service_role admin client (server actions only).
create policy "topic_items_write_service_only"
  on topic_items for all
  using  (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
