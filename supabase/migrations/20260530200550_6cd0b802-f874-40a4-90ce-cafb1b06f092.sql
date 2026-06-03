-- Create project-thumbnails bucket for project previews
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-thumbnails', 'project-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Project thumbnails publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-thumbnails');

-- Users can upload/update/delete their own thumbnails (path prefix = user id)
CREATE POLICY "Users upload own project thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own project thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own project thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);