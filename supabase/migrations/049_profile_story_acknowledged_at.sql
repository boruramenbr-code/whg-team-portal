-- ============================================================
-- WHG TEAM PORTAL — STORY ACKNOWLEDGED TIMESTAMP
-- One-time onboarding flag: when a staff member acknowledges
-- they've read Our Story, Mission & Values, this column is set
-- to now(). NULL = haven't read yet → OurStoryModal pops on
-- their next portal load.
--
-- Pairs with the existing handbook section "Our Story, Mission
-- & Values" (migration 048) so the modal content stays in sync
-- with the handbook reader.
-- ============================================================

alter table profiles add column if not exists story_acknowledged_at timestamptz;
