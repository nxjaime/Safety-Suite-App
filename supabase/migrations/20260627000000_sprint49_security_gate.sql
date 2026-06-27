-- Sprint 49 security gate: remove known permissive tenant-data policies.
-- Run after older public/demo migrations so this migration wins policy precedence.

REVOKE ALL ON public.carrier_settings FROM anon;
REVOKE ALL ON public.carrier_health_cache FROM anon;
REVOKE ALL ON public.inspections FROM anon;

DROP POLICY IF EXISTS "Enable read/write for all users" ON public.inspections;
DROP POLICY IF EXISTS "Enable read/write for all users" ON public.carrier_settings;
DROP POLICY IF EXISTS "Enable read/write for all users" ON public.equipment;
DROP POLICY IF EXISTS "Enable read/write for all users" ON public.pm_templates;
DROP POLICY IF EXISTS "Enable read/write for all users" ON public.work_orders;
DROP POLICY IF EXISTS "Enable read/write for all users" ON public.work_order_line_items;
DROP POLICY IF EXISTS "Allow all for carrier_settings" ON public.carrier_settings;
DROP POLICY IF EXISTS "Allow all for carrier_health_cache" ON public.carrier_health_cache;
DROP POLICY IF EXISTS "Public Read" ON public.drivers;
DROP POLICY IF EXISTS "Public Insert" ON public.drivers;
DROP POLICY IF EXISTS "Public Update" ON public.drivers;
DROP POLICY IF EXISTS "Public Read" ON public.accidents;
DROP POLICY IF EXISTS "Public Insert" ON public.accidents;
DROP POLICY IF EXISTS "Public Update" ON public.accidents;
DROP POLICY IF EXISTS "Public Read" ON public.citations;
DROP POLICY IF EXISTS "Public Insert" ON public.citations;
DROP POLICY IF EXISTS "Public Update" ON public.citations;
DROP POLICY IF EXISTS "Public Read" ON public.risk_events;
DROP POLICY IF EXISTS "Public Insert" ON public.risk_events;
DROP POLICY IF EXISTS "Public Update" ON public.risk_events;
DROP POLICY IF EXISTS "Public Delete" ON public.risk_events;
DROP POLICY IF EXISTS "Public Read" ON public.tasks;
DROP POLICY IF EXISTS "Public Insert" ON public.tasks;
DROP POLICY IF EXISTS "Public Update" ON public.tasks;
DROP POLICY IF EXISTS "Public Delete" ON public.tasks;
DROP POLICY IF EXISTS "Public Read" ON public.coaching_plans;
DROP POLICY IF EXISTS "Public Insert" ON public.coaching_plans;
DROP POLICY IF EXISTS "Public Update" ON public.coaching_plans;
DROP POLICY IF EXISTS "Public Delete" ON public.coaching_plans;
DROP POLICY IF EXISTS "Public Read Documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Public Insert Documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Public Delete Documents" ON public.driver_documents;

CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Org Access Drivers" ON public.drivers;
CREATE POLICY "Org Access Drivers" ON public.drivers
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Tasks" ON public.tasks;
CREATE POLICY "Org Access Tasks" ON public.tasks
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Risk Events" ON public.risk_events;
CREATE POLICY "Org Access Risk Events" ON public.risk_events
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Coaching Plans" ON public.coaching_plans;
CREATE POLICY "Org Access Coaching Plans" ON public.coaching_plans
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Driver Documents" ON public.driver_documents;
CREATE POLICY "Org Access Driver Documents" ON public.driver_documents
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Carrier Settings" ON public.carrier_settings;
CREATE POLICY "Org Access Carrier Settings" ON public.carrier_settings
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Carrier Health Cache" ON public.carrier_health_cache;
CREATE POLICY "Org Access Carrier Health Cache" ON public.carrier_health_cache
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Inspections" ON public.inspections;
CREATE POLICY "Org Access Inspections" ON public.inspections
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());
