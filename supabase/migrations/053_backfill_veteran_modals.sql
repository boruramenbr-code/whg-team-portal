-- ============================================================
-- WHG TEAM PORTAL — VETERAN MODAL BACKFILL
-- Migration 052 stamped wizard_completed_at for staff who were
-- treated as "veterans" (hired more than 30 days ago, OR already
-- dismissed both legacy popups). But it didn't also stamp the
-- legacy welcome/story dismissals — so for veterans hired before
-- those features existed, the legacy modals still fired on every
-- HomeTab load.
--
-- This migration silences both legacy modals for anyone whose
-- wizard_completed_at has been stamped. The mental model: if you
-- skipped the wizard (or were pre-stamped as a veteran), you also
-- don't need the legacy popups.
--
-- Idempotent.
-- ============================================================

update profiles
set welcome_dismissed_at = coalesce(welcome_dismissed_at, wizard_completed_at, now())
where wizard_completed_at is not null
  and welcome_dismissed_at is null;

update profiles
set story_acknowledged_at = coalesce(story_acknowledged_at, wizard_completed_at, now())
where wizard_completed_at is not null
  and story_acknowledged_at is null;
