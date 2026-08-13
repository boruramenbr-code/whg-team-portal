-- ============================================================
-- 076 — Memories: featured Events row
--
-- Randy's call (2026-08-09): company gatherings (Christmas party,
-- crawfish boil, grand openings) get the FRONT ROW of the wall —
-- big gold-trimmed event cards in a horizontal row above the
-- collage. Long-form compilations live on YouTube (no length cap,
-- no storage cost) and embed in the card.
--
-- Scoping reuses what exists: brand-wide featured (restaurant_id
-- null) fronts EVERY wall; restaurant-scoped featured fronts that
-- wall only.
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table memories add column if not exists featured boolean not null default false;

create index if not exists memories_featured_idx
  on memories (active, featured, created_at desc);
