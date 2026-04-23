-- Migration 013: Rename manager_locations → user_locations
-- Expands multi-location support from managers only to ALL roles (including employees).

-- 1. Rename the table
ALTER TABLE manager_locations RENAME TO user_locations;

-- 2. Rename indexes
ALTER INDEX idx_manager_locations_profile RENAME TO idx_user_locations_profile;
ALTER INDEX idx_manager_locations_restaurant RENAME TO idx_user_locations_restaurant;

-- 3. Drop old RLS policies
DROP POLICY IF EXISTS "admin_full_access_manager_locations" ON user_locations;
DROP POLICY IF EXISTS "managers_read_own_locations" ON user_locations;

-- 4. Create new RLS policies (expanded to all roles)

-- Admins can do everything
CREATE POLICY "admin_full_access_user_locations"
  ON user_locations
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

-- All users can read their own location assignments
CREATE POLICY "users_read_own_locations"
  ON user_locations
  FOR SELECT
  USING (profile_id = auth.uid());
