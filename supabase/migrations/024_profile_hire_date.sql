-- profiles.hire_date — actual employment start date.
--
-- Why: profiles.created_at is "when admin added them to the portal",
-- which is fine for new hires (set close to their start) but very wrong
-- for the 94 bulk-imported staff who all have the same created_at (the
-- day of bulk import). Without a real hire_date column, the anniversary
-- widget would silently fail for an entire year, then fire all 94 alerts
-- on the same day.
--
-- Add Member modal sets this to "today" by default for new hires.
-- Bulk-imported staff stay NULL — admin can backfill from a fresh 7shifts
-- export later, or just live without anniversaries for that batch.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hire_date date;

-- Index for the anniversary lookup (next anniversary within 7 days)
CREATE INDEX IF NOT EXISTS idx_profiles_hire_month_day
  ON profiles (EXTRACT(MONTH FROM hire_date), EXTRACT(DAY FROM hire_date))
  WHERE hire_date IS NOT NULL;
