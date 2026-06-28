DROP POLICY IF EXISTS "org can read templates" ON public.training_templates;
DROP POLICY IF EXISTS "org can modify templates" ON public.training_templates;
DROP POLICY IF EXISTS "org can read assignments" ON public.training_assignments;
DROP POLICY IF EXISTS "org can modify assignments" ON public.training_assignments;

CREATE POLICY "Org Access Training Templates" ON public.training_templates
  FOR ALL USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "Org Access Training Assignments" ON public.training_assignments
  FOR ALL USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());
