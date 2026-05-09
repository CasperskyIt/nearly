-- Allow inviting users who don't have an account yet
-- by making user_id nullable and adding invited_email column

-- 1. Drop the old UNIQUE constraint (includes user_id which will be nullable)
ALTER TABLE public.dog_guardians
  DROP CONSTRAINT IF EXISTS dog_guardians_dog_id_user_id_status_key;

-- 2. Make user_id nullable
ALTER TABLE public.dog_guardians
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add invited_email column for pending (no-account) invites
ALTER TABLE public.dog_guardians
  ADD COLUMN IF NOT EXISTS invited_email TEXT;

-- 4. New unique constraints:
--    - one invite per (dog, existing user)
--    - one pending invite per (dog, email)
CREATE UNIQUE INDEX IF NOT EXISTS uq_dog_guardians_dog_user
  ON public.dog_guardians (dog_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dog_guardians_dog_email
  ON public.dog_guardians (dog_id, invited_email)
  WHERE invited_email IS NOT NULL AND user_id IS NULL;

-- 5. Trigger: when a new user registers, link any pending email invites to their account
CREATE OR REPLACE FUNCTION public.link_pending_guardian_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dog_guardians
  SET user_id = NEW.id,
      invited_email = NULL
  WHERE invited_email = LOWER(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_registered_link_invites ON auth.users;
CREATE TRIGGER on_user_registered_link_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_pending_guardian_invites();
