-- ============================================================
-- WHG TEAM PORTAL — ORG CHART MIGRATION
-- Adds the org_chart_positions table for per-restaurant
-- organizational charts.
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists org_chart_positions (
  id              uuid primary key default gen_random_uuid(),

  -- Which restaurant this position belongs to
  restaurant_id   uuid not null references restaurants(id) on delete cascade,

  -- Person info
  first_name      text not null,
  last_initial    text not null default '',
  title           text not null,            -- e.g. 'General Manager', 'FOH Manager', 'Line Cook'

  -- Hierarchy: role_level determines the visual tier
  -- 1 = Owner/GM, 2 = Manager, 3 = Team Lead/Supervisor, 4 = Staff
  role_level      int not null default 4,

  -- Self-referencing FK for the reporting chain
  reports_to      uuid references org_chart_positions(id) on delete set null,

  -- Optional photo (storage path in a future bucket, or external URL)
  photo_url       text,

  -- Display ordering within the same level/parent
  sort_order      int not null default 1,

  -- Optional contact or fun detail shown on tap
  detail          text,

  active          boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists org_chart_restaurant_idx
  on org_chart_positions (restaurant_id, role_level, sort_order);

create index if not exists org_chart_reports_to_idx
  on org_chart_positions (reports_to);

-- RLS — authenticated users can read active positions; admin-only writes.
alter table org_chart_positions enable row level security;

drop policy if exists "org_chart_read" on org_chart_positions;
create policy "org_chart_read"
  on org_chart_positions for select
  to authenticated
  using (active = true);

drop policy if exists "org_chart_admin_write" on org_chart_positions;
create policy "org_chart_admin_write"
  on org_chart_positions for all
  to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- updated_at trigger
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists set_org_chart_updated_at on org_chart_positions;
    create trigger set_org_chart_updated_at
      before update on org_chart_positions
      for each row execute function set_updated_at();
  end if;
end $$;
