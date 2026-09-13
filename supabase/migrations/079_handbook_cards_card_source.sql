-- ============================================================
-- 079 — Quick Guide: per-card booklet source
--
-- The "Things Most People Don't Know" topic collects cards from many
-- booklet sections, so each card records its own source section.
-- Card-level source wins over the topic's; the API uses it for the
-- "Read the full section" link and for the needs-review flag when a
-- booklet section is edited after its cards were reviewed.
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table handbook_cards
  add column if not exists booklet_section_id uuid references handbook_sections(id) on delete set null;
