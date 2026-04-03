-- ── Migration 013: Auth-gated RLS for topic ownership ────────────────────────
--
-- Adds INSERT / UPDATE / DELETE policies to the topics table so that:
--   - Any authenticated user can create a new topic (they become the owner)
--   - Only the owner can mutate their topic's metadata
--   - System topics (is_system = true) cannot be mutated via the API
--
-- The existing SELECT policy from migration 010 is left in place.
-- The service_role admin client bypasses all RLS and continues to work.
--
-- Safe: additive policies only, no schema changes.

-- Authenticated users can create new (non-system) topics they own.
create policy "topics_insert_authenticated"
  on topics for insert
  with check (
    auth.role() = 'service_role'
    or (
      auth.uid() is not null
      and is_system = false
      and owner_id  = auth.uid()
    )
  );

-- Only the owner can update their own non-system topic.
create policy "topics_update_owner"
  on topics for update
  using (
    auth.role() = 'service_role'
    or (owner_id = auth.uid() and is_system = false)
  );

-- Only the owner can delete their own non-system topic.
create policy "topics_delete_owner"
  on topics for delete
  using (
    auth.role() = 'service_role'
    or (owner_id = auth.uid() and is_system = false)
  );
