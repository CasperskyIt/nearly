-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Places table
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category TEXT NOT NULL,
  address TEXT,
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  website TEXT,
  phone TEXT,
  opening_hours TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_dog_friendly BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create geospatial index for location-based queries
CREATE INDEX places_location_idx ON public.places USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Places policies
CREATE POLICY "Anyone can view places" ON public.places FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert places" ON public.places FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update places they created" ON public.places FOR UPDATE USING (auth.uid() = created_by);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Function to get places within radius (in kilometers)
CREATE OR REPLACE FUNCTION get_places_nearby(
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  category TEXT,
  address TEXT,
  rating DECIMAL(2, 1),
  review_count INTEGER,
  is_verified BOOLEAN,
  is_dog_friendly BOOLEAN,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.latitude,
    p.longitude,
    p.category,
    p.address,
    p.rating,
    p.review_count,
    p.is_verified,
    p.is_dog_friendly,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326),
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    ) / 1000 AS distance_km
  FROM public.places p
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326),
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    radius_km * 1000
  )
  ORDER BY distance_km;
END;
$$;

-- ============================================================
-- Phase 3: Dog Profiles — Dogs, Guardians, and RLS Foundation
-- Migration: supabase/migrations/20260328_create_dogs_tables.sql
-- ============================================================

-- Dogs table
CREATE TABLE IF NOT EXISTS public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dog Guardians table
CREATE TABLE IF NOT EXISTS public.dog_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guardian' CHECK (role IN ('owner', 'guardian')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted')),
  invite_token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dog_id, user_id, status)
);

-- Care Events table (empty in Phase 3, RLS written now per Pitfall 1)
CREATE TABLE IF NOT EXISTS public.care_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('feeding', 'weight', 'note', 'medication_dose')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Records table (empty in Phase 3, RLS written now)
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('vaccination', 'medication')),
  name TEXT NOT NULL,
  given_at DATE,
  next_due_at DATE,
  dose TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table (empty in Phase 3, RLS written now)
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  health_record_id UUID REFERENCES public.health_records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  message TEXT,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- is_dog_guardian() function
CREATE OR REPLACE FUNCTION public.is_dog_guardian(p_dog_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dogs
    WHERE id = p_dog_id AND owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.dog_guardians
    WHERE dog_id = p_dog_id
      AND user_id = auth.uid()
      AND status = 'accepted'
  );
$$;

-- Enable RLS on all 5 tables
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies on dogs
CREATE POLICY "Guardians can view dogs" ON public.dogs
  FOR SELECT USING (public.is_dog_guardian(id));
CREATE POLICY "Authenticated users can create dogs" ON public.dogs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Guardians can update dogs" ON public.dogs
  FOR UPDATE USING (public.is_dog_guardian(id));
CREATE POLICY "Guardians can delete dogs" ON public.dogs
  FOR DELETE USING (public.is_dog_guardian(id));

-- RLS policies on dog_guardians
CREATE POLICY "Guardians can view dog_guardians" ON public.dog_guardians
  FOR SELECT USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can insert dog_guardians" ON public.dog_guardians
  FOR INSERT WITH CHECK (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can update dog_guardians" ON public.dog_guardians
  FOR UPDATE USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can delete dog_guardians" ON public.dog_guardians
  FOR DELETE USING (public.is_dog_guardian(dog_id));

-- RLS policies on care_events
CREATE POLICY "Guardians can view care_events" ON public.care_events
  FOR SELECT USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can insert care_events" ON public.care_events
  FOR INSERT WITH CHECK (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can update care_events" ON public.care_events
  FOR UPDATE USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can delete care_events" ON public.care_events
  FOR DELETE USING (public.is_dog_guardian(dog_id));

-- RLS policies on health_records
CREATE POLICY "Guardians can view health_records" ON public.health_records
  FOR SELECT USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can insert health_records" ON public.health_records
  FOR INSERT WITH CHECK (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can update health_records" ON public.health_records
  FOR UPDATE USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can delete health_records" ON public.health_records
  FOR DELETE USING (public.is_dog_guardian(dog_id));

-- RLS policies on reminders
CREATE POLICY "Guardians can view reminders" ON public.reminders
  FOR SELECT USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can insert reminders" ON public.reminders
  FOR INSERT WITH CHECK (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can update reminders" ON public.reminders
  FOR UPDATE USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can delete reminders" ON public.reminders
  FOR DELETE USING (public.is_dog_guardian(dog_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dogs_owner ON public.dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_dog_guardians_dog_user ON public.dog_guardians(dog_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_care_events_dog_occurred ON public.care_events(dog_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_dog ON public.health_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.reminders(due_at) WHERE sent = false;

-- Auto-create owner guardian row via trigger
CREATE OR REPLACE FUNCTION public.create_owner_guardian()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.dog_guardians (dog_id, user_id, role, status, invite_token)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'accepted', NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_dog_created
  AFTER INSERT ON public.dogs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_owner_guardian();

-- ── Storage: dog-avatars bucket ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-avatars', 'dog-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload dog avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dog-avatars');

CREATE POLICY "Public read dog avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'dog-avatars');

CREATE POLICY "Authenticated users can update dog avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dog-avatars');

CREATE POLICY "Authenticated users can delete dog avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dog-avatars');

