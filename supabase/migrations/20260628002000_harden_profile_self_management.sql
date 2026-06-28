ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('platform_admin', 'full', 'safety', 'coaching', 'maintenance', 'readonly', 'driver', 'admin', 'manager', 'viewer'));

CREATE OR REPLACE FUNCTION public.can_manage_profile_security()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('platform_admin', 'admin', 'full', 'manager')
      AND status IS DISTINCT FROM 'deactivated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.id = auth.uid() THEN
    IF NEW.organization_id IS NOT NULL THEN
      RAISE EXCEPTION 'Users cannot self-assign organization_id';
    END IF;

    IF COALESCE(NEW.role, 'readonly') NOT IN ('readonly', 'viewer') THEN
      RAISE EXCEPTION 'Users cannot self-assign privileged roles';
    END IF;

    IF COALESCE(NEW.status, 'active') NOT IN ('active', 'invited') THEN
      RAISE EXCEPTION 'Users cannot self-assign account status';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.id = auth.uid() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Users cannot change their own role';
    END IF;

    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Users cannot change their own organization_id';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Users cannot change their own account status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_security_fields ON public.profiles;
CREATE TRIGGER protect_profile_security_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self insert limited" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update safe fields" ON public.profiles;
DROP POLICY IF EXISTS "Profiles org admin select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles org admin update" ON public.profiles;

CREATE POLICY "Profiles self select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Profiles self insert limited" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND organization_id IS NULL
    AND COALESCE(role, 'readonly') IN ('readonly', 'viewer')
    AND COALESCE(status, 'active') IN ('active', 'invited')
  );

CREATE POLICY "Profiles self update safe fields" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles org admin select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.can_manage_profile_security()
    AND organization_id = public.get_org_id()
  );

CREATE POLICY "Profiles org admin update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.can_manage_profile_security()
    AND organization_id = public.get_org_id()
  )
  WITH CHECK (
    public.can_manage_profile_security()
    AND organization_id = public.get_org_id()
  );

