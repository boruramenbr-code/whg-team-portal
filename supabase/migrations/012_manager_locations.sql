-- Migration 012: Manager Locations Junction Table
-- Allows managers and assistant managers to be assigned to multiple restaurant locations.
-- Admins automatically see all locations (handled in app logic, not here).
-- Staff (employees) keep their single restaurant_id on the profiles table.

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS manager_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, restaurant_id)
);

-- 2. Enable RLS
ALTER TABLE manager_locations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Admins can do everything
CREATE POLICY "admin_full_access_manager_locations"
  ON manager_locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Managers/assistant managers can read their own location assignments
CREATE POLICY "managers_read_own_locations"
  ON manager_locations
  FOR SELECT
  USING (profile_id = auth.uid());

-- 4. Create index for faster lookups
CREATE INDEX idx_manager_locations_profile ON manager_locations(profile_id);
CREATE INDEX idx_manager_locations_restaurant ON manager_locations(restaurant_id);
