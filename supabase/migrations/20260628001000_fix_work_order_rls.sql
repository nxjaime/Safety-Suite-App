DROP POLICY IF EXISTS "Org Access Work Orders" ON public.work_orders;
CREATE POLICY "Org Access Work Orders" ON public.work_orders
  FOR ALL TO authenticated
  USING (organization_id = public.get_org_id())
  WITH CHECK (organization_id = public.get_org_id());

DROP POLICY IF EXISTS "Org Access Work Order Line Items" ON public.work_order_line_items;
CREATE POLICY "Org Access Work Order Line Items" ON public.work_order_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND wo.organization_id = public.get_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.work_orders wo
      WHERE wo.id = work_order_id
        AND wo.organization_id = public.get_org_id()
    )
  );
