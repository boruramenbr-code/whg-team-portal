-- ============================================================
-- WHG TEAM PORTAL — MENU TRAINING (Phase A: menu library)
--
-- Restaurant-scoped menu library that powers the Training → Menu
-- sub-tab. Staff see ONLY their own restaurant's menu; admins and
-- multi-location managers (user_locations) can view any of theirs.
--
-- Two tables:
--   • menu_categories — per-restaurant groupings (Rolls, Ramen, Apps…)
--   • menu_items      — the training card: photo, description,
--                       ingredients, allergens, prep notes, upsell tip.
--                       Bilingual EN/ES columns follow the handbook
--                       *_es convention.
--
-- Allergens are a text[] of standardized keys (shellfish, fish, soy,
-- wheat, egg, dairy, peanut, tree_nut, sesame) so Phase B can
-- auto-draft quiz questions from them. The client renders the chips
-- and owns the EN/ES display labels.
--
-- Phase B (quizzes) adds its own tables and DOES NOT touch these.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1) CATEGORIES ----------------------------------------------
create table if not exists menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  name_es       text,
  -- Lower numbers render first. Convention: 100, 200, 300 with room to insert.
  sort_order    int  not null default 100,
  -- Soft delete — flip to false to hide without losing the items underneath.
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists menu_categories_restaurant_sort_idx
  on menu_categories (restaurant_id, active, sort_order);

-- 2) ITEMS ---------------------------------------------------
create table if not exists menu_items (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references menu_categories(id) on delete cascade,
  -- Denormalized from the category so restaurant scoping (RLS + queries)
  -- never needs a join. The API keeps it in sync on insert/move.
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  name           text not null,
  name_es        text,
  description    text,
  description_es text,
  -- Free text, one ingredient per line — readable for staff, parseable
  -- enough for Phase B question drafting.
  ingredients    text,
  ingredients_es text,
  -- Standardized allergen keys (see header comment).
  allergens      text[] not null default '{}',
  prep_notes     text,
  prep_notes_es  text,
  -- Optional one-liner servers can use to sell the item.
  upsell_note    text,
  upsell_note_es text,
  -- Display-only price text ("$12.95", "MP"). Not used for math.
  price          text,
  photo_url      text,
  sort_order     int  not null default 100,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists menu_items_category_sort_idx
  on menu_items (category_id, active, sort_order);
create index if not exists menu_items_restaurant_idx
  on menu_items (restaurant_id, active);

-- 3) RLS -----------------------------------------------------
alter table menu_categories enable row level security;
alter table menu_items enable row level security;

-- READ: your own restaurant's menu, any restaurant if admin, or any
-- restaurant you're assigned to via user_locations (multi-location mgrs).
drop policy if exists "menu_categories_read_scoped" on menu_categories;
create policy "menu_categories_read_scoped"
  on menu_categories for select to authenticated
  using (
    exists (
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
    exists (
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

-- WRITE: manager+ only. The API routes additionally enforce that
-- non-admin managers only write to restaurants they can access
-- (writes go through the service-role client after that check,
-- same pattern as bar cards / training).
drop policy if exists "menu_categories_write_mgmt" on menu_categories;
create policy "menu_categories_write_mgmt"
  on menu_categories for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

drop policy if exists "menu_items_write_mgmt" on menu_items;
create policy "menu_items_write_mgmt"
  on menu_items for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('manager', 'assistant_manager', 'admin')
    )
  );

-- 4) STORAGE — menu-photos bucket ----------------------------
-- Public bucket: menu photos aren't sensitive and public URLs keep the
-- staff menu grid fast (no signed-URL round trips). 5MB cap; client
-- compresses to ~0.5-2MB JPEG before upload (bar-cards pipeline).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-photos',
  'menu-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "menu_photos_public_read" on storage.objects;
create policy "menu_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'menu-photos');

-- Uploads/deletes go through the service-role client in the API after a
-- manager-role check, so no authenticated write policy is needed here.

-- ============================================================
-- Done. Categories + items are authored via Admin → Training → Menu.
-- ============================================================
