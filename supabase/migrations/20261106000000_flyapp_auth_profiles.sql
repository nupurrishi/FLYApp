-- FLYApp Supabase Auth Profiles
-- Public registration: Models and Designers only.
-- Admin accounts are created separately.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'model'::public.user_role,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read only their own profile.
DROP POLICY IF EXISTS "Users can read their own FLYApp profile"
ON public.profiles;

CREATE POLICY "Users can read their own FLYApp profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Automatically create profiles for new users.
CREATE OR REPLACE FUNCTION public.handle_flyapp_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_role text;
BEGIN
  requested_role := COALESCE(
    NEW.raw_user_meta_data ->> 'role',
    'model'
  );

  -- Public registration can only create Models or Designers.
  IF requested_role NOT IN ('model', 'designer') THEN
    requested_role := 'model';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    requested_role::public.user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_flyapp_auth_user_created
ON auth.users;

CREATE TRIGGER on_flyapp_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_flyapp_new_user();

-- Backfill existing accounts without profiles.
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', ''),
  CASE
    WHEN u.raw_user_meta_data ->> 'role' = 'designer'
      THEN 'designer'::public.user_role
    WHEN u.raw_user_meta_data ->> 'role' = 'admin'
      THEN 'admin'::public.user_role
    ELSE 'model'::public.user_role
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE p.id = u.id
);

-- IMPORTANT: Do not add client INSERT/UPDATE policies for profiles.
-- Public users must never be able to promote themselves to Admin.
