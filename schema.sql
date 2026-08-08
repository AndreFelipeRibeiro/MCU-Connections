-- MCU Connections V3 — watch tracking schema
-- Run in the Supabase SQL editor. Idempotent: safe to re-run.
--
-- Validated against PostgreSQL 16 with a stubbed auth schema: runs clean twice,
-- all three CHECK constraints reject bad rows, RLS isolates users on SELECT /
-- INSERT / UPDATE / DELETE, the WITH CHECK clause blocks reassigning a row to
-- another user, anon is denied entirely, the updated_at trigger fires, and
-- deleting an auth.users row cascades.
--
-- Design notes:
--   * The catalog lives in data.js, NOT here. title_id is a plain text
--     reference to TITLES[].id and is intentionally not a foreign key.
--   * There is no 'none' status. Absence of a row IS 'none'; clearing a
--     status is a DELETE.
--   * The primary key (user_id, title_id) already indexes user_id as the
--     leftmost column, which is what every query filters on. A separate
--     index on user_id would be redundant.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.title_states (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  title_id   text        not null,
  status     text        not null,
  seen_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint title_states_pkey primary key (user_id, title_id),
  constraint title_states_status_check check (status in ('seen', 'watchlist')),
  constraint title_states_title_id_not_blank check (length(trim(title_id)) > 0),
  -- seen_at is only meaningful for 'seen' rows.
  constraint title_states_seen_at_check check (status = 'seen' or seen_at is null)
);

comment on table  public.title_states is
  'Per-user watch state. One row per tracked title; no row means "none".';
comment on column public.title_states.title_id is
  'Stable id from data.js TITLES[].id. Permanent — never renamed, never reused.';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists title_states_set_updated_at on public.title_states;

create trigger title_states_set_updated_at
  before update on public.title_states
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- (select auth.uid()) rather than bare auth.uid() so Postgres evaluates the
-- function once per query instead of once per row.

alter table public.title_states enable row level security;

drop policy if exists "own rows: select" on public.title_states;
drop policy if exists "own rows: insert" on public.title_states;
drop policy if exists "own rows: update" on public.title_states;
drop policy if exists "own rows: delete" on public.title_states;

create policy "own rows: select"
  on public.title_states
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "own rows: insert"
  on public.title_states
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "own rows: update"
  on public.title_states
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own rows: delete"
  on public.title_states
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Anonymous visitors track locally in localStorage and never touch this table,
-- so the anon role gets nothing. Deliberately no policies for it.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- RLS is the security boundary; grants just open the door for the role.

grant select, insert, update, delete on public.title_states to authenticated;
revoke all on public.title_states from anon;

-- ---------------------------------------------------------------------------
-- Sanity checks after running this file
-- ---------------------------------------------------------------------------
-- 1. RLS is on:
--      select relrowsecurity from pg_class where relname = 'title_states';
--      -- expect: t
--
-- 2. Four policies exist with the right clauses:
--      select cmd, qual, with_check from pg_policies
--      where tablename = 'title_states';
--
-- 3. Isolation, from the app with two different signed-in users: user A must
--    get zero rows when selecting user B's rows. Verify at the API layer too,
--    not just in the UI.
