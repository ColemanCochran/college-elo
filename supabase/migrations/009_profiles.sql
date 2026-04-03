-- ── Migration 009: User profiles ─────────────────────────────────────────────
--
-- Creates a public profiles table linked 1-to-1 with auth.users.
-- A trigger auto-inserts a profile row whenever a new user signs up,
-- so the app never has to manage this manually.
--
-- Safe: additive only, no existing tables modified.

create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,                       -- nullable until user sets one
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_profiles_username on profiles (username) where username is not null;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();   -- reuses trigger from migration 001

-- Auto-create a profile row whenever a user signs up via Supabase Auth.
-- SECURITY DEFINER so the function can write to public.profiles even though
-- it fires from auth.users (a different schema).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table profiles enable row level security;

create policy "profiles_select_all"
  on profiles for select using (true);

create policy "profiles_insert_own"
  on profiles for insert
  with check (id = auth.uid() or auth.role() = 'service_role');

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid() or auth.role() = 'service_role');
