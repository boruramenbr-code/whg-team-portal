-- ============================================================
-- WHG TEAM PORTAL — MENU ITEM VIDEOS
--
-- Randy's ask: alongside the photo, a menu item can carry a video
-- (how it's made, how it's cut, how it plates). Stored as a YouTube
-- video id — same pipeline as training videos: managers paste any
-- YouTube URL shape, the API extracts the 11-char id. Direct video
-- file uploads are deliberately NOT supported (phone videos exceed
-- hosting request limits; unlisted YouTube is the house standard).
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table menu_items add column if not exists video_youtube_id text;

-- ============================================================
-- Done.
-- ============================================================
