-- ============================================================
-- WHG TEAM PORTAL — WELCOME WIZARD
-- Replaces the two-popup welcome flow (welcome note + Our Story
-- modals) with a single full-screen 4-step wizard for new hires:
--   1) Install the app on your phone (iOS / Android instructions)
--   2) Welcome note from ownership
--   3) Our Story, Mission & Values
--   4) Intro to your onboarding checklist
--
-- Adds a single column `profiles.wizard_completed_at`. The wizard
-- fires while this column is null; finishing it stamps now().
--
-- Backfill protects existing staff so they NEVER see the wizard.
-- Anyone who:
--   • was hired more than 30 days ago, OR
--   • has already dismissed welcome AND acknowledged Our Story
-- gets wizard_completed_at = now() at migration time.
--
-- Anyone hired in the last 30 days who hasn't completed both
-- existing acknowledgments gets the new wizard on next login.
--
-- Idempotent.
-- ============================================================

alter table profiles
  add column if not exists wizard_completed_at timestamptz;

-- Backfill veterans + already-acknowledged staff. Only sets the
-- column if currently null, so this is safe to re-run.
update profiles
set wizard_completed_at = now()
where wizard_completed_at is null
  and (
    -- Hired more than 30 days ago (veterans)
    (hire_date is not null and hire_date < (current_date - interval '30 days'))
    or
    -- Already dismissed both legacy popups
    (welcome_dismissed_at is not null and story_acknowledged_at is not null)
  );

-- Helpful index for the "do I need the wizard?" check on every login.
create index if not exists profiles_wizard_completed_idx
  on profiles (wizard_completed_at)
  where wizard_completed_at is null;
