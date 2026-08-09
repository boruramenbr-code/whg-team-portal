-- ============================================================
-- 075 — Memories: native video upload
--
-- Randy's call (2026-08-09): videos go straight on the wall, no
-- YouTube step. Mechanics:
--   • memories.video_url — file lives in the public 'memories'
--     bucket alongside photos.
--   • Bucket accepts video/mp4 + video/quicktime, limit 100MB.
--   • Client uploads DIRECTLY to storage via a signed upload URL
--     (Vercel API routes cap request bodies — videos can't ride
--     through them like photos do). The API only signs + records.
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table memories add column if not exists video_url text;

-- Media check widens: photo, YouTube, or uploaded video.
alter table memories drop constraint if exists memories_check;
alter table memories drop constraint if exists memories_media_check;
alter table memories
  add constraint memories_media_check
  check (photo_url is not null or video_youtube_id is not null or video_url is not null);

-- Bucket: allow videos, raise the per-file cap to 100MB.
update storage.buckets
   set file_size_limit = 104857600,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
 where id = 'memories';

-- Signed uploads write as the authenticated role — allow inserts into
-- this bucket (the API's manager check gates who gets a signed URL).
drop policy if exists "memories_signed_upload" on storage.objects;
create policy "memories_signed_upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'memories');
