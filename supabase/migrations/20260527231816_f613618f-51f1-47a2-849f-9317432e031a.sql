-- User-owned custom components library
CREATE TABLE public.user_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Personalizado',
  subtitle TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT 'Personalizado',
  width INTEGER NOT NULL DEFAULT 60,
  height INTEGER NOT NULL DEFAULT 80,
  image_url TEXT,
  thumbnail_url TEXT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_components_user_id ON public.user_components(user_id);
CREATE INDEX idx_user_components_category ON public.user_components(category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_components TO authenticated;
GRANT ALL ON public.user_components TO service_role;

ALTER TABLE public.user_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own components"
  ON public.user_components FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users insert own components"
  ON public.user_components FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own components"
  ON public.user_components FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own components"
  ON public.user_components FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_components_updated_at
  BEFORE UPDATE ON public.user_components
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for user component images (public reads, owner writes)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('user-components', 'user-components', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "User component images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-components');

CREATE POLICY "Users upload own component images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-components' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own component images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'user-components' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own component images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-components' AND auth.uid()::text = (storage.foldername(name))[1]);