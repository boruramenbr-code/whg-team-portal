-- ============================================================
-- 077 — Memories: lightweight thumbnails
--
-- Load-time fix (2026-09-12). Wall tiles and the Home card were
-- rendering FULL media: 2048px photos (~0.5MB each) and raw video
-- files (one Ichiban card carried 57MB of HEVC video it had to probe
-- just to draw two tiles). Tiles now show thumb_url — a ~720px JPEG
-- (photo thumbnail, or a still frame for videos) — and the full file
-- loads only when someone taps.
--
-- Null thumb_url is always safe: tiles fall back to the full media.
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table memories add column if not exists thumb_url text;
