-- Holidays as date RANGES instead of single dates.
--
-- Use cases that drove this:
--   • LSU exam week (~5 days)
--   • Restaurant Week (~7 days)
--   • Mardi Gras parade weekend (~3 days)
--   • Lent (~40 days)
--   • Single-day events (Good Friday, Mother's Day) still work — end_date = start_date

-- 1. Rename existing column for clarity
ALTER TABLE holidays RENAME COLUMN date TO start_date;

-- 2. Add end_date, default to start_date for backward compat
ALTER TABLE holidays ADD COLUMN IF NOT EXISTS end_date date;
UPDATE holidays SET end_date = start_date WHERE end_date IS NULL;
ALTER TABLE holidays ALTER COLUMN end_date SET NOT NULL;

-- 3. Constraint: end on or after start
ALTER TABLE holidays
  DROP CONSTRAINT IF EXISTS holidays_end_after_start;
ALTER TABLE holidays
  ADD CONSTRAINT holidays_end_after_start CHECK (end_date >= start_date);

-- 4. Update indexes — drop old, add new ones
DROP INDEX IF EXISTS holidays_date_idx;
CREATE INDEX IF NOT EXISTS holidays_start_date_idx ON holidays (start_date);
CREATE INDEX IF NOT EXISTS holidays_end_date_idx ON holidays (end_date);
