-- ============================================================
-- 094 — Start Here → Welcome (Randy, Sept 23 2026)
--
-- The Welcome page is the first thing a new hire sees in Start Here:
-- the owner's welcome video, their progress, their first steps, their
-- restaurant, their people, the apps they'll use, and the Quick Guide
-- topics to read first.
--
--   1) restaurant_info — the per-restaurant details a new hire needs on
--      day one (address, phone, hours, parking, where to enter, first-day
--      notes), EN + ES. Managers fill it in from Mission Control; empty
--      fields simply don't show.
--   2) whg_settings — small key/value store for group-wide settings.
--      First key: welcome_video_url (the owner's welcome video — shown on
--      the Welcome page and in the first guided-training step).
--
-- Reads: any signed-in user. Writes: only through the app's API
-- (service role, manager/admin checks) — no write policies here.
-- Safe to run more than once.
-- ============================================================

create table if not exists restaurant_info (
  restaurant_id  uuid primary key references restaurants(id) on delete cascade,
  address        text,
  maps_url       text,
  phone          text,
  hours          text,
  hours_es       text,
  parking        text,
  parking_es     text,
  entrance       text,
  entrance_es    text,
  first_day      text,
  first_day_es   text,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references profiles(id) on delete set null
);

alter table restaurant_info enable row level security;
drop policy if exists "restaurant_info_read" on restaurant_info;
create policy "restaurant_info_read" on restaurant_info
  for select to authenticated using (true);

create table if not exists whg_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references profiles(id) on delete set null
);

alter table whg_settings enable row level security;
drop policy if exists "whg_settings_read" on whg_settings;
create policy "whg_settings_read" on whg_settings
  for select to authenticated using (true);

-- ── Result ─────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.tables where table_name in ('restaurant_info', 'whg_settings')) as tables_ready;
