-- ============================================================
-- 074 — Memories (🎞 the WHG photo wall)
--
-- Randy's idea (2026-08-09): a photo/video collage of the history,
-- games, events, and fun at each restaurant. EVERY employee sees
-- EVERY restaurant's wall (culture crosses restaurants — a Boru
-- cook browsing Ichiban's hibachi nights sees room to grow),
-- divided by restaurant chips. Curated: managers/admins upload;
-- staff hand photos to a manager.
--
-- restaurant_id null = brand-wide WHG moment (holiday parties,
-- company events) — shows on every restaurant's wall.
--
-- Removal rule (stated on the page): anyone in a photo can ask a
-- manager to take it down, no questions asked.
--
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists memories (
  id               uuid primary key default gen_random_uuid(),
  -- null = brand-wide (shows on every wall)
  restaurant_id    uuid references restaurants(id) on delete cascade,
  photo_url        text,
  -- YouTube embeds ride along with a ▶ badge (either photo or video).
  video_youtube_id text,
  caption          text,
  caption_es       text,
  -- Free-text when label ("Crawfish Boil · May 2023") — human memory,
  -- not a timestamp. Sorting uses created_at.
  taken_label      text,
  uploaded_by      uuid references auth.users(id) on delete set null,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (photo_url is not null or video_youtube_id is not null)
);

create index if not exists memories_wall_idx
  on memories (active, restaurant_id, created_at desc);

-- RLS: every authenticated employee reads every wall (Randy's call —
-- open like the handbook). Writes go through the API's service-role
-- client after a manager check, so no insert/update policies here.
alter table memories enable row level security;

drop policy if exists "memories_read_all" on memories;
create policy "memories_read_all" on memories
  for select to authenticated using (active = true);

-- Storage bucket for the photos (public read, like menu-photos).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "memories_public_read" on storage.objects;
create policy "memories_public_read"
on storage.objects for select
using (bucket_id = 'memories');
