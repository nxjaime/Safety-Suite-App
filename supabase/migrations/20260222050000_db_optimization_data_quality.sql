-- Sprint 8: DB optimization and data quality hardening

-- Performance indexes on high-frequency access paths
CREATE INDEX IF NOT EXISTS idx_drivers_org_name ON public.drivers (organization_id, name);
CREATE INDEX IF NOT EXISTS idx_drivers_org_status ON public.drivers (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_org_status_due ON public.tasks (organization_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_inspections_org_date ON public.inspections (organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_events_org_occurred ON public.risk_events (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_orders_org_status ON public.work_orders (organization_id, status);

-- Data quality constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drivers_risk_score_range'
  ) THEN
    ALTER TABLE public.drivers
      ADD CONSTRAINT drivers_risk_score_range CHECK (risk_score BETWEEN 0 AND 100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feedback_message_min_len'
  ) THEN
    ALTER TABLE public.feedback_entries
      ADD CONSTRAINT feedback_message_min_len CHECK (char_length(trim(message)) >= 8);
  END IF;
END $$;

-- Ensure core text fields are non-empty for quality
UPDATE public.drivers
SET name = 'Unknown Driver'
WHERE name IS NULL OR trim(name) = '';

ALTER TABLE public.drivers
  ALTER COLUMN name SET NOT NULL;

UPDATE public.tasks
SET title = 'Untitled Task'
WHERE title IS NULL OR trim(title) = '';

ALTER TABLE public.tasks
  ALTER COLUMN title SET NOT NULL;
