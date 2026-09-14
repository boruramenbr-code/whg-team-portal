-- 080_manager_academy.sql
--
-- WHG Manager Academy foundation (Randy, Sept 13 2026). Extends what
-- already exists — no new training system:
--   • Sections (menu_categories) get a third zone, 'academy', plus a
--     managers-only switch (audience), a pillar (leadership / operations /
--     administration), and review info (version, last reviewed, next
--     review due, sources) so lessons on things that change — payroll
--     rules, software screens, labor law — get re-checked on a schedule.
--   • Cards (menu_items) can carry a practice calculator (widget).
--   • Video series get a pillar; videos get review info.
--   • Read policies: managers-only sections, their cards, and managers-only
--     video series never reach staff, even by querying the database
--     directly. (Until now only the API hid manager videos.)
--
-- Idempotent — safe to run more than once.

-- ── Sections ────────────────────────────────────────────────────────────
alter table menu_categories drop constraint if exists menu_categories_zone_check;
alter table menu_categories add constraint menu_categories_zone_check
  check (zone in ('menu', 'systems', 'academy'));

alter table menu_categories add column if not exists audience text not null default 'all';
alter table menu_categories drop constraint if exists menu_categories_audience_check;
alter table menu_categories add constraint menu_categories_audience_check
  check (audience in ('all', 'mgmt'));

alter table menu_categories add column if not exists pillar text;
alter table menu_categories drop constraint if exists menu_categories_pillar_check;
alter table menu_categories add constraint menu_categories_pillar_check
  check (pillar is null or pillar in ('leadership', 'operations', 'administration'));

-- Manager Academy lessons are always managers-only.
alter table menu_categories drop constraint if exists menu_categories_academy_mgmt_check;
alter table menu_categories add constraint menu_categories_academy_mgmt_check
  check (zone <> 'academy' or audience = 'mgmt');

alter table menu_categories add column if not exists version int not null default 1;
alter table menu_categories add column if not exists last_reviewed_at date;
alter table menu_categories add column if not exists review_due_at date;
alter table menu_categories add column if not exists sources text;

create index if not exists menu_categories_review_due_idx
  on menu_categories (review_due_at) where review_due_at is not null;

-- ── Cards ───────────────────────────────────────────────────────────────
alter table menu_items add column if not exists widget text;
alter table menu_items drop constraint if exists menu_items_widget_check;
alter table menu_items add constraint menu_items_widget_check
  check (widget is null or widget in ('true_cost', 'labor_budget'));

-- ── Videos ──────────────────────────────────────────────────────────────
alter table training_series add column if not exists pillar text;
alter table training_series drop constraint if exists training_series_pillar_check;
alter table training_series add constraint training_series_pillar_check
  check (pillar is null or pillar in ('leadership', 'operations', 'administration'));

alter table training_videos add column if not exists last_reviewed_at date;
alter table training_videos add column if not exists review_due_at date;
alter table training_videos add column if not exists sources text;

-- ── Read policies ───────────────────────────────────────────────────────
-- Management = admin / manager / assistant manager, or the mgmt onboarding
-- category — the same rule /api/training already uses.

drop policy if exists "menu_categories_read_scoped" on menu_categories;
create policy "menu_categories_read_scoped"
  on menu_categories for select to authenticated
  using (
    (
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
    )
    and (
      audience = 'all'
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and (p.role in ('admin', 'manager', 'assistant_manager') or p.onboarding_category = 'mgmt')
      )
    )
  );

drop policy if exists "menu_items_read_scoped" on menu_items;
create policy "menu_items_read_scoped"
  on menu_items for select to authenticated
  using (
    (
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
    )
    and exists (
      select 1 from menu_categories c
      where c.id = menu_items.category_id
        and (
          c.audience = 'all'
          or exists (
            select 1 from profiles p
            where p.id = auth.uid()
              and (p.role in ('admin', 'manager', 'assistant_manager') or p.onboarding_category = 'mgmt')
          )
        )
    )
  );

drop policy if exists "training_series_read_all" on training_series;
drop policy if exists "training_series_read_scoped" on training_series;
create policy "training_series_read_scoped"
  on training_series for select to authenticated
  using (
    audience = 'all'
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.role in ('admin', 'manager', 'assistant_manager') or p.onboarding_category = 'mgmt')
    )
  );

drop policy if exists "training_videos_read_all" on training_videos;
drop policy if exists "training_videos_read_scoped" on training_videos;
create policy "training_videos_read_scoped"
  on training_videos for select to authenticated
  using (
    exists (
      select 1 from training_series s
      where s.id = training_videos.series_id
        and (
          s.audience = 'all'
          or exists (
            select 1 from profiles p
            where p.id = auth.uid()
              and (p.role in ('admin', 'manager', 'assistant_manager') or p.onboarding_category = 'mgmt')
          )
        )
    )
  );
