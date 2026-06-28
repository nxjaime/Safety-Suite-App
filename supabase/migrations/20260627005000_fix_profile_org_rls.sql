DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own organization" ON public.organizations;

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read own organization" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.get_org_id());
