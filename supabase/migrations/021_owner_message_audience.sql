-- Owner messages: split into staff-facing and manager-facing.
--
-- Existing messages all default to 'staff' (current behavior — they show on
-- the home tab for everyone). Going forward, the editor lets the owner pick:
--   • staff     — only on the staff home tab (rotating leadership notes)
--   • managers  — only on Mission Control (serious leadership memos)
--   • both      — appears on both surfaces

ALTER TABLE owner_messages
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'staff';

ALTER TABLE owner_messages
  DROP CONSTRAINT IF EXISTS owner_messages_audience_check;

ALTER TABLE owner_messages
  ADD CONSTRAINT owner_messages_audience_check
  CHECK (audience IN ('staff', 'managers', 'both'));

CREATE INDEX IF NOT EXISTS idx_owner_messages_audience
  ON owner_messages (audience, is_active);
