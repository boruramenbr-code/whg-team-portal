-- profiles.welcome_until — controls "Welcome to the team" spotlight on home
--
-- A nullable date column. If welcome_until >= today, the profile shows in
-- the home tab's "Welcome to the team" section. NULL = not featured.
--
-- Defaults:
--   • Add Member modal sets it to today + 30 days for new employees
--   • Bulk import leaves it NULL (already-tenured staff don't get featured)
--   • Admin can set/extend/clear from the AdminPanel inline edit row

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS welcome_until date;

-- Index for the home-tab query (active profiles where welcome_until >= today)
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_until
  ON profiles (welcome_until)
  WHERE welcome_until IS NOT NULL;
