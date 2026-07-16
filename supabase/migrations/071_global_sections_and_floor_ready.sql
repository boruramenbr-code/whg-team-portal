-- ============================================================
-- WHG TEAM PORTAL — GLOBAL SECTIONS + FLOOR-READY OVERRIDES
--
-- Two pieces of groundwork from Randy's 2026-07-15 direction:
--
-- 1) GLOBAL (brand-wide) menu sections. restaurant_id becomes nullable
--    on menu_categories/menu_items: NULL = every restaurant sees it.
--    First use: "Service: Beginning to End" — the server service cycle,
--    which Randy wants IDENTICAL at every restaurant ("no matter the
--    ticket size — similar, professional, genuine"). Global content is
--    admin-edited only (restaurant managers keep editing their own).
--
-- 2) floor_ready_overrides — Phase C fairness rule: Randy or a manager
--    can make a judgment call and mark someone Floor-Ready even if
--    modules remain (or revoke it). Every override records WHO granted
--    it, so judgment stays accountable.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1) Nullable restaurant scoping ------------------------------
alter table menu_categories alter column restaurant_id drop not null;
alter table menu_items alter column restaurant_id drop not null;

-- RLS: global rows (restaurant_id IS NULL) readable by everyone.
drop policy if exists "menu_categories_read_scoped" on menu_categories;
create policy "menu_categories_read_scoped"
  on menu_categories for select to authenticated
  using (
    restaurant_id is null
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role = 'admin' or p.restaurant_id = menu_categories.restaurant_id)
    )
    or exists (
      select 1 from user_locations ul
      where ul.profile_id = auth.uid()
        and ul.restaurant_id = menu_categories.restaurant_id
    )
  );

drop policy if exists "menu_items_read_scoped" on menu_items;
create policy "menu_items_read_scoped"
  on menu_items for select to authenticated
  using (
    restaurant_id is null
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role = 'admin' or p.restaurant_id = menu_items.restaurant_id)
    )
    or exists (
      select 1 from user_locations ul
      where ul.profile_id = auth.uid()
        and ul.restaurant_id = menu_items.restaurant_id
    )
  );

-- 2) Floor-Ready overrides ------------------------------------
create table if not exists floor_ready_overrides (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid not null references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

alter table floor_ready_overrides enable row level security;

drop policy if exists "floor_ready_overrides_read" on floor_ready_overrides;
create policy "floor_ready_overrides_read"
  on floor_ready_overrides for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

-- Writes go through the API's service-role client after a manager check.

-- ============================================================
-- Done. After this runs: Claude seeds the global "Service: Beginning
-- to End" section, then Phase C (badge + Pre-Floor board) ships on top.
-- ============================================================
