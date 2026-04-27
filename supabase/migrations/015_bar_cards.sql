-- Bar Cards: track alcohol service certification cards for staff
-- Managers can upload card photos, OCR extracts name + expiration
-- Expiration tracking with status badges (valid, expiring_soon, expired)

CREATE TABLE IF NOT EXISTS bar_cards (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  employee_name   text NOT NULL,
  expiration_date date NOT NULL,
  card_image_url  text NOT NULL,
  notes           text,
  uploaded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS bar_cards_restaurant_idx ON bar_cards (restaurant_id);
CREATE INDEX IF NOT EXISTS bar_cards_expiration_idx ON bar_cards (expiration_date);

-- RLS
ALTER TABLE bar_cards ENABLE ROW LEVEL SECURITY;

-- Managers+ at the same restaurant can view bar cards
CREATE POLICY "Managers can view bar cards"
  ON bar_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager', 'assistant_manager')
        AND (p.role = 'admin' OR p.restaurant_id = bar_cards.restaurant_id)
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      JOIN user_locations ul ON ul.profile_id = p.id
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager', 'assistant_manager')
        AND ul.restaurant_id = bar_cards.restaurant_id
    )
  );

-- Managers+ can insert bar cards
CREATE POLICY "Managers can insert bar cards"
  ON bar_cards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager', 'assistant_manager')
    )
  );

-- Managers+ can update bar cards
CREATE POLICY "Managers can update bar cards"
  ON bar_cards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager', 'assistant_manager')
    )
  );

-- Managers+ can delete bar cards
CREATE POLICY "Managers can delete bar cards"
  ON bar_cards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager', 'assistant_manager')
    )
  );

-- Storage bucket for bar card images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bar-cards',
  'bar-cards',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Public read (managers view card images in the UI)
CREATE POLICY "Public read access for bar cards"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bar-cards');

-- Authenticated upload/update/delete
CREATE POLICY "Authenticated users can upload bar cards"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bar-cards');

CREATE POLICY "Authenticated users can update bar cards"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'bar-cards');

CREATE POLICY "Authenticated users can delete bar cards"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'bar-cards');
