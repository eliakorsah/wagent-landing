-- Storage Buckets & Policies
-- Run in Supabase SQL Editor → New query → paste → Run

-- ── Create bucket (public so logo URLs work without signed URLs) ──────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-logos',
  'business-logos',
  true,
  2097152,                          -- 2 MB max
  ARRAY['image/png','image/jpeg','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS policies ──────────────────────────────────────────────────────

-- Authenticated users can upload into their own folder (folder = business id)
CREATE POLICY "Owners can upload logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Owners can update / replace their logo
CREATE POLICY "Owners can update logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Owners can delete their logo
CREATE POLICY "Owners can delete logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Anyone can read (bucket is public, but policy still required)
CREATE POLICY "Public logo read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-logos');
