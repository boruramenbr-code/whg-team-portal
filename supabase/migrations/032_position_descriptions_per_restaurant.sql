-- ============================================================
-- WHG TEAM PORTAL — POSITION DESCRIPTIONS PER RESTAURANT
-- Adds the position_descriptions table so each restaurant can
-- have its own version of a position's job description.
--
-- The positions table stays as the canonical role catalog
-- (name, emoji, department, sort_order) shared across the brand.
-- This table holds the per-restaurant content layer.
--
-- Visibility rule applied by /api/positions: a position only
-- shows on a restaurant's staff portal if a description exists
-- for that (position_id, restaurant_id) pair.
--
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists position_descriptions (
  id              uuid primary key default gen_random_uuid(),
  position_id     uuid not null references positions(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,

  -- Markdown-style structured description (same format that
  -- PositionDescriptionRenderer parses: ## headers, ### subheaders,
  -- > callouts, - bullets, [POS_INFO] block, **bold**, *italic*).
  description     text not null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (position_id, restaurant_id)
);

create index if not exists position_desc_position_idx
  on position_descriptions (position_id);
create index if not exists position_desc_restaurant_idx
  on position_descriptions (restaurant_id);

alter table position_descriptions enable row level security;

-- Read: any authenticated user. The API layer is responsible for
-- scoping to the caller's own restaurant — the RLS read policy is
-- intentionally permissive so admins can view across restaurants.
drop policy if exists "position_descriptions_read" on position_descriptions;
create policy "position_descriptions_read"
  on position_descriptions for select
  to authenticated
  using (true);

-- Write: admin (owner) only.
drop policy if exists "position_descriptions_admin_write" on position_descriptions;
create policy "position_descriptions_admin_write"
  on position_descriptions for all
  to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- updated_at trigger (reuse existing helper if present)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists set_position_descriptions_updated_at on position_descriptions;
    create trigger set_position_descriptions_updated_at
      before update on position_descriptions
      for each row execute function set_updated_at();
  end if;
end $$;
