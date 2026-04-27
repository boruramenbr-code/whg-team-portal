-- Create storage bucket for team profile photos
-- NOTE: This must also be run via Supabase Dashboard > Storage > Create bucket
-- Bucket name: team-photos
-- Public: Yes (photos are displayed to all team members)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage bucket policies (RLS)
-- Allow public read access (anyone can view photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-photos',
  'team-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can read photos (they're displayed in the team directory)
CREATE POLICY "Public read access for team photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-photos');

-- Policy: Managers and admins can upload/update photos
-- (Actual permission checking is done in the API route using service role key,
--  so we allow all authenticated users here since the API handles authorization)
CREATE POLICY "Authenticated users can upload team photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-photos');

CREATE POLICY "Authenticated users can update team photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-photos');

CREATE POLICY "Authenticated users can delete team photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team-photos');
