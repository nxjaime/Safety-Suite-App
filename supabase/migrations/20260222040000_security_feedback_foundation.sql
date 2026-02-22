-- Sprint 7 foundation: security role hardening + feedback backlog

-- Normalize profile role values for RBAC
UPDATE public.profiles
SET role = 'admin'
WHERE role IS NULL OR role NOT IN ('admin', 'manager', 'viewer');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'manager', 'viewer'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Feedback backlog table
CREATE TABLE IF NOT EXISTS public.feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitter_email TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Review', 'Planned', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org Access Feedback Entries" ON public.feedback_entries;
CREATE POLICY "Org Access Feedback Entries" ON public.feedback_entries
  FOR ALL
  USING (organization_id = get_org_id())
  WITH CHECK (organization_id = get_org_id());

CREATE INDEX IF NOT EXISTS idx_feedback_entries_org_created_at
  ON public.feedback_entries (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_entries_status
  ON public.feedback_entries (organization_id, status);
