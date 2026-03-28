-- ROLLBACK:
-- DROP TRIGGER IF EXISTS on_dog_created ON public.dogs;
-- DROP FUNCTION IF EXISTS public.create_owner_guardian();
-- DROP FUNCTION IF EXISTS public.is_dog_guardian(UUID);
-- DROP TABLE IF EXISTS public.reminders;
-- DROP TABLE IF EXISTS public.health_records;
-- DROP TABLE IF EXISTS public.care_events;
-- DROP TABLE IF EXISTS public.dog_guardians;
-- DROP TABLE IF EXISTS public.dogs;

-- ============================================================
-- Phase 3: Dog Profiles — Dogs, Guardians, and RLS Foundation
-- ============================================================

-- 1. Dogs table
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

-- 2. Dog Guardians table
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

-- 3. Care Events table (empty in Phase 3, RLS written now per Pitfall 1)
CREATE TABLE IF NOT EXISTS public.care_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('feeding', 'weight', 'note', 'medication_dose')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Health Records table (empty in Phase 3, RLS written now)
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

-- 5. Reminders table (empty in Phase 3, RLS written now)
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

-- 6. is_dog_guardian() function
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

-- 7. Enable RLS on all 5 tables
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies on dogs
CREATE POLICY "Guardians can view dogs" ON public.dogs
  FOR SELECT USING (public.is_dog_guardian(id));
CREATE POLICY "Authenticated users can create dogs" ON public.dogs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Guardians can update dogs" ON public.dogs
  FOR UPDATE USING (public.is_dog_guardian(id));
CREATE POLICY "Guardians can delete dogs" ON public.dogs
  FOR DELETE USING (public.is_dog_guardian(id));

-- 9. RLS policies on dog_guardians
CREATE POLICY "Guardians can view dog_guardians" ON public.dog_guardians
  FOR SELECT USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can insert dog_guardians" ON public.dog_guardians
  FOR INSERT WITH CHECK (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can update dog_guardians" ON public.dog_guardians
  FOR UPDATE USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can delete dog_guardians" ON public.dog_guardians
  FOR DELETE USING (public.is_dog_guardian(dog_id));

-- 10. RLS policies on care_events
CREATE POLICY "Guardians can view care_events" ON public.care_events
  FOR SELECT USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can insert care_events" ON public.care_events
  FOR INSERT WITH CHECK (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can update care_events" ON public.care_events
  FOR UPDATE USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can delete care_events" ON public.care_events
  FOR DELETE USING (public.is_dog_guardian(dog_id));

-- 11. RLS policies on health_records
CREATE POLICY "Guardians can view health_records" ON public.health_records
  FOR SELECT USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can insert health_records" ON public.health_records
  FOR INSERT WITH CHECK (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can update health_records" ON public.health_records
  FOR UPDATE USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can delete health_records" ON public.health_records
  FOR DELETE USING (public.is_dog_guardian(dog_id));

-- 12. RLS policies on reminders
CREATE POLICY "Guardians can view reminders" ON public.reminders
  FOR SELECT USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can insert reminders" ON public.reminders
  FOR INSERT WITH CHECK (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can update reminders" ON public.reminders
  FOR UPDATE USING (public.is_dog_guardian(dog_id));
CREATE POLICY "Guardians can delete reminders" ON public.reminders
  FOR DELETE USING (public.is_dog_guardian(dog_id));

-- 13. Indexes
CREATE INDEX IF NOT EXISTS idx_dogs_owner ON public.dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_dog_guardians_dog_user ON public.dog_guardians(dog_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_care_events_dog_occurred ON public.care_events(dog_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_dog ON public.health_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.reminders(due_at) WHERE sent = false;

-- 14. Auto-create owner guardian row via trigger
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

-- ============================================================
-- STORAGE BUCKET SETUP (run via Supabase Dashboard or Storage API):
-- Bucket name: dog-avatars
-- Public: true (public read access)
-- File size limit: 5242880 (5MB)
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Path pattern: {dog_id}.{ext} (e.g., abc-123.jpg)
--
-- Storage policies (run in SQL Editor):
-- CREATE POLICY "Public read dog avatars" ON storage.objects FOR SELECT USING (bucket_id = 'dog-avatars');
-- CREATE POLICY "Authenticated upload dog avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dog-avatars' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated update dog avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'dog-avatars' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated delete dog avatars" ON storage.objects FOR DELETE USING (bucket_id = 'dog-avatars' AND auth.role() = 'authenticated');
-- ============================================================
