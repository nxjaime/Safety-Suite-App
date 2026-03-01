-- Sprint 14: Work order lifecycle and inspection linkage

ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS inspection_id uuid;

CREATE INDEX IF NOT EXISTS work_orders_inspection_id_idx ON public.work_orders (inspection_id);
CREATE INDEX IF NOT EXISTS work_orders_status_idx ON public.work_orders (status);
CREATE INDEX IF NOT EXISTS work_orders_due_date_idx ON public.work_orders (due_date);
