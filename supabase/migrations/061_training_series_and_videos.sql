-- ============================================================
-- WHG TEAM PORTAL — TRAINING (Phase 1: foundation)
-- Builds a video-training library for all staff. Two tables:
--   • training_series  — groups of related videos (e.g. "Preston Lee's
--                        30% Rule"). Has a title, blurb, sort order.
--   • training_videos  — individual videos belonging to a series.
--                        Holds the YouTube video ID + display metadata.
--
-- YouTube videos are referenced by `youtube_id` (the 11-char ID from the
-- URL, e.g. "dQw4w9WgXcQ"). The client builds the embed URL itself.
-- Recommended privacy: Unlisted — anyone with the link can watch,
-- doesn't surface in YouTube search.
--
-- Phases 2+ (quizzes, completion tracking, Mission Control reporting)
-- add more tables but DO NOT touch these — they're stable.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- 1) SERIES ---------------------------------------------------
create table if not exists training_series (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  -- Optional one-line description shown under the series title.
  blurb       text,
  -- Lower numbers render first. Convention: 100, 200, 300 with room to insert.
  sort_order  int  not null default 100,
  -- Soft delete — flip to false to hide without losing the videos underneath.
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists training_series_active_sort_idx
  on training_series (active, sort_order);

-- 2) VIDEOS ---------------------------------------------------
create table if not exists training_videos (
  id           uuid primary key default gen_random_uuid(),
  series_id    uuid not null references training_series(id) on delete cascade,
  title        text not null,
  -- Optional context shown under the video title.
  description  text,
  -- 11-character YouTube video ID extracted from the URL.
  -- e.g. https://youtu.be/dQw4w9WgXcQ  →  "dQw4w9WgXcQ"
  youtube_id   text not null,
  -- Optional duration shown as a chip ("12:34"). Free text — Randy enters
  -- what YouTube shows; we don't parse it.
  duration     text,
  -- Lower numbers render first within a series.
  sort_order   int  not null default 100,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists training_videos_series_sort_idx
  on training_videos (series_id, active, sort_order);

-- 3) RLS ------------------------------------------------------
alter table training_series enable row level security;
alter table training_videos enable row level security;

-- Anyone authenticated (any active staff) can READ training content.
drop policy if exists "training_series_read_all" on training_series;
create policy "training_series_read_all"
  on training_series for select to authenticated using (true);

drop policy if exists "training_videos_read_all" on training_videos;
create policy "training_videos_read_all"
  on training_videos for select to authenticated using (true);

-- Only managers / asst managers / admins can WRITE (insert/update/delete).
drop policy if exists "training_series_write_mgmt" on training_series;
create policy "training_series_write_mgmt"
  on training_series for all to authenticated
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

drop policy if exists "training_videos_write_mgmt" on training_videos;
create policy "training_videos_write_mgmt"
  on training_videos for all to authenticated
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

-- 4) SEED — first series so Randy can drop videos in immediately ---
insert into training_series (title, blurb, sort_order)
select 'Preston Lee''s 30% Rule',
       'Service vs Hospitality — Randy''s original series on the difference between getting it right and getting it remembered.',
       100
where not exists (
  select 1 from training_series where title = 'Preston Lee''s 30% Rule'
);

-- ============================================================
-- Done. Add videos via the Training admin tab (Phase 1) or with:
--   insert into training_videos (series_id, title, youtube_id, sort_order)
--   values ((select id from training_series where title = '...'),
--           'Episode 1 — Welcome', 'YYYYYYYYYYY', 100);
-- ============================================================
