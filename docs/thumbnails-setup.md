/*
  Schema update (if needed via Supabase dashboard):
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

  Bucket should be public:
  - project-thumbnails (Public: true)
*/
