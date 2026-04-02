-- Tighten RLS: restrict all write operations to service_role only.
--
-- The anon key is exposed in the browser bundle (NEXT_PUBLIC_*).
-- The permissive write policies (using (true)) allow anyone who discovers
-- the anon key to update ELO ratings or insert fake votes directly via the
-- Supabase REST API, bypassing all server-side logic entirely.
--
-- The admin (service_role) client bypasses RLS entirely, so all existing
-- server actions continue to work unchanged.

-- Votes: anon can read, only service_role can insert; no updates/deletes
drop policy if exists "votes_insert_all" on votes;
create policy "votes_insert_service_only" on votes
  for insert with check (auth.role() = 'service_role');

-- Colleges: anon can read, only service_role can update
drop policy if exists "colleges_update_service" on colleges;
create policy "colleges_update_service_only" on colleges
  for update using (auth.role() = 'service_role');

-- elo_ratings: anon can read, only service_role can insert or update
drop policy if exists "elo_ratings_update_service" on elo_ratings;
drop policy if exists "elo_ratings_insert_service" on elo_ratings;
create policy "elo_ratings_update_service_only" on elo_ratings
  for update using (auth.role() = 'service_role');
create policy "elo_ratings_insert_service_only" on elo_ratings
  for insert with check (auth.role() = 'service_role');
