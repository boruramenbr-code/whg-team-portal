-- Add archived flag and profile link to bar_cards
ALTER TABLE bar_cards
  ADD COLUMN archived boolean NOT NULL DEFAULT false,
  ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for fast filtering by archived status
CREATE INDEX idx_bar_cards_archived ON bar_cards(archived);

-- Index for profile_id lookups
CREATE INDEX idx_bar_cards_profile_id ON bar_cards(profile_id);

-- Function: when a profile is archived, auto-archive their bar cards
CREATE OR REPLACE FUNCTION auto_archive_bar_cards()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
    UPDATE bar_cards SET archived = true, updated_at = now()
    WHERE profile_id = NEW.id AND archived = false;
  END IF;
  -- When a profile is restored, restore their bar cards too
  IF NEW.status = 'active' AND OLD.status = 'archived' THEN
    UPDATE bar_cards SET archived = false, updated_at = now()
    WHERE profile_id = NEW.id AND archived = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on profiles table
CREATE TRIGGER trg_auto_archive_bar_cards
  AFTER UPDATE OF status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_archive_bar_cards();
