-- Add email column to profiles (synced from auth.users)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Backfill existing profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Trigger function: keep profiles.email in sync when auth.users email changes
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- RLS: allow authenticated users to look up profiles by email (for invite flow)
CREATE POLICY IF NOT EXISTS "Authenticated users can search profiles by email"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
