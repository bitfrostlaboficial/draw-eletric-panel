-- =========================================================
-- Profiles
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =========================================================
-- Roles (separate table to avoid privilege escalation)
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Profile auto-creation trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- Timestamps trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Official component catalog
-- =========================================================
CREATE TABLE public.catalog_components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  width INTEGER NOT NULL DEFAULT 40,
  height INTEGER NOT NULL DEFAULT 80,
  accent TEXT,
  poles INTEGER,
  capacity TEXT,
  current TEXT,
  voltage TEXT,
  power TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.catalog_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog readable by everyone"
  ON public.catalog_components FOR SELECT USING (true);

CREATE POLICY "Admins insert catalog"
  ON public.catalog_components FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update catalog"
  ON public.catalog_components FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete catalog"
  ON public.catalog_components FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER catalog_components_updated_at
  BEFORE UPDATE ON public.catalog_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_catalog_category ON public.catalog_components(category);
CREATE INDEX idx_catalog_brand ON public.catalog_components(brand);

-- =========================================================
-- Storage bucket for component images
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('component-images', 'component-images', true);

CREATE POLICY "Component images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'component-images');

CREATE POLICY "Admins upload component images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'component-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update component images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'component-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete component images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'component-images' AND public.has_role(auth.uid(), 'admin'));