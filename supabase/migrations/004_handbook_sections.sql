-- ============================================================
-- WHG TEAM PORTAL — HANDBOOK READER MIGRATION
-- Adds the handbook_sections table used by the read-only handbook viewer.
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists handbook_sections (
  id                  uuid primary key default gen_random_uuid(),

  -- Language code: 'en' (English) or 'es' (Spanish). v1 seeds English only.
  language            text not null default 'en'
                        check (language in ('en', 'es')),

  -- Handbook version number. Current handbook is v4 ("v4.0" in the PDF).
  -- Bumping version lets us retain prior versions in place for audit.
  handbook_version    int  not null default 4,

  -- Optional per-restaurant scope. Null = WHG-wide section (the default).
  -- Reserved for future location-specific overrides; not used in v1.
  restaurant_id       uuid references restaurants(id) on delete cascade,

  sort_order          int  not null,
  title               text not null,
  body                text not null,

  -- Who can see this section in the reader.
  role_visibility     text not null default 'all'
                        check (role_visibility in ('employee', 'manager', 'all')),

  active              boolean not null default true,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists handbook_sections_lang_ver_idx
  on handbook_sections (language, handbook_version, active, sort_order);

create index if not exists handbook_sections_restaurant_idx
  on handbook_sections (restaurant_id);

-- RLS — everyone who is authenticated can read the active handbook for
-- their language + role. Writes are admin-only.
alter table handbook_sections enable row level security;

drop policy if exists "handbook_sections_read" on handbook_sections;
create policy "handbook_sections_read"
  on handbook_sections for select
  to authenticated
  using (
    active = true
    and (
      role_visibility = 'all'
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and (
            (role_visibility = 'employee')
            or (role_visibility = 'manager'
                and p.role in ('manager', 'assistant_manager', 'admin'))
          )
      )
    )
  );

drop policy if exists "handbook_sections_admin_write" on handbook_sections;
create policy "handbook_sections_admin_write"
  on handbook_sections for all
  to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- updated_at trigger (reuse existing function if present)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop trigger if exists set_handbook_sections_updated_at on handbook_sections;
    create trigger set_handbook_sections_updated_at
      before update on handbook_sections
      for each row execute function set_updated_at();
  end if;
end $$;
