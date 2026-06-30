-- Restore org-scoped RLS policies for fleet operations tables after Sprint 49
-- removed the older permissive demo policies.

DROP POLICY IF EXISTS "Org Access Equipment" ON public.equipment;
CREATE POLICY "Org Access Equipment" ON public.equipment
  FOR ALL
  TO authenticated
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access PM Templates" ON public.pm_templates;
CREATE POLICY "Org Access PM Templates" ON public.pm_templates
  FOR ALL
  TO authenticated
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Work Orders" ON public.work_orders;
CREATE POLICY "Org Access Work Orders" ON public.work_orders
  FOR ALL
  TO authenticated
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Work Order Line Items" ON public.work_order_line_items;
CREATE POLICY "Org Access Work Order Line Items" ON public.work_order_line_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id = work_order_line_items.work_order_id
        AND wo.organization_id = public.get_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id = work_order_line_items.work_order_id
        AND wo.organization_id = public.get_org_id()
    )
  );
