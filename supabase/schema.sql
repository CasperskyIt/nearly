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
