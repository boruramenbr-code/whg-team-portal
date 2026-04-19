-- ============================================================
-- WHG TEAM PORTAL — HANDBOOK MEDIA MIGRATION
-- Adds the handbook_media table for inline infographics attached to
-- handbook sections, plus a public-read Storage bucket 'handbook-media'.
-- Run in: Supabase Dashboard → SQL Editor
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists handbook_media (
  id              uuid primary key default gen_random_uuid(),

  -- Which handbook section this infographic belongs to
  section_id      uuid not null references handbook_sections(id) on delete cascade,

  -- Ordering when a section has multiple infographics
  sort_order      int not null default 1,

  -- Path inside the 'handbook-media' Storage bucket (e.g. '90day.png')
  storage_path    text not null,

  -- Short caption shown below the thumbnail
  caption         text,

  -- Accessibility description (screen readers)
  alt_text        text not null default '',

  active          boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists handbook_media_section_idx
  on handbook_media (section_id, sort_order);

-- RLS — authenticated users can read active media; admin-only writes.
alter table handbook_media enable row level security;

drop policy if exists "handbook_media_read" on handbook_media;
create policy "handbook_media_read"
  on handbook_media for select
  to authenticated
  using (active = true);

drop policy if exists "handbook_media_admin_write" on handbook_media;
create policy "handbook_media_admin_write"
  on handbook_media for all
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
    drop trigger if exists set_handbook_media_updated_at on handbook_media;
    create trigger set_handbook_media_updated_at
      before update on handbook_media
      for each row execute function set_updated_at();
  end if;
end $$;

-- ============================================================
-- Storage bucket: handbook-media
-- Public read (so <img src="..."> works without auth), admin-only write.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('handbook-media', 'handbook-media', true)
on conflict (id) do update set public = excluded.public;

-- Storage policies
drop policy if exists "handbook_media_public_read" on storage.objects;
create policy "handbook_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'handbook-media');

drop policy if exists "handbook_media_admin_upload" on storage.objects;
create policy "handbook_media_admin_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'handbook-media'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "handbook_media_admin_update" on storage.objects;
create policy "handbook_media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'handbook-media'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "handbook_media_admin_delete" on storage.objects;
create policy "handbook_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'handbook-media'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
