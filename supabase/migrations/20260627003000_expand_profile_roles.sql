ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('platform_admin', 'full', 'safety', 'coaching', 'maintenance', 'readonly', 'admin', 'manager', 'viewer'));
