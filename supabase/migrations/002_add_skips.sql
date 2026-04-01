-- Add skips column to track how often each college is skipped
alter table colleges add column if not exists skips integer not null default 0;
