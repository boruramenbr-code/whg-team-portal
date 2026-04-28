-- Add date_of_birth to profiles for birthday tracking
ALTER TABLE profiles
  ADD COLUMN date_of_birth date;

-- Index for month-day lookups (upcoming birthdays query)
CREATE INDEX idx_profiles_birth_month_day
  ON profiles (EXTRACT(MONTH FROM date_of_birth), EXTRACT(DAY FROM date_of_birth))
  WHERE date_of_birth IS NOT NULL;
