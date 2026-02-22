-- Sprint 6: Compliance + documents workflow hardening

-- Documents library table for auditable uploads
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    doc_type TEXT,
    file_size BIGINT,
    mime_type TEXT,
    storage_bucket TEXT NOT NULL DEFAULT 'compliance-documents',
    storage_path TEXT NOT NULL UNIQUE,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    linked_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org Access Documents" ON public.documents;
CREATE POLICY "Org Access Documents" ON public.documents
    FOR ALL
    USING (organization_id = get_org_id())
    WITH CHECK (organization_id = get_org_id());

CREATE INDEX IF NOT EXISTS idx_documents_org_category ON public.documents (organization_id, category);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON public.documents (uploaded_at DESC);

-- Ensure a dedicated private bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-documents', 'compliance-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Org Upload Compliance Documents" ON storage.objects;
CREATE POLICY "Org Upload Compliance Documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'compliance-documents'
    AND split_part(name, '/', 1) = get_org_id()::text
);

DROP POLICY IF EXISTS "Org Read Compliance Documents" ON storage.objects;
CREATE POLICY "Org Read Compliance Documents" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'compliance-documents'
    AND split_part(name, '/', 1) = get_org_id()::text
);

DROP POLICY IF EXISTS "Org Delete Compliance Documents" ON storage.objects;
CREATE POLICY "Org Delete Compliance Documents" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'compliance-documents'
    AND split_part(name, '/', 1) = get_org_id()::text
);

DROP POLICY IF EXISTS "Org Upload Driver Documents" ON storage.objects;
CREATE POLICY "Org Upload Driver Documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'driver-documents'
    AND split_part(name, '/', 1) = get_org_id()::text
);

DROP POLICY IF EXISTS "Org Read Driver Documents" ON storage.objects;
CREATE POLICY "Org Read Driver Documents" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'driver-documents'
    AND split_part(name, '/', 1) = get_org_id()::text
);

DROP POLICY IF EXISTS "Org Delete Driver Documents" ON storage.objects;
CREATE POLICY "Org Delete Driver Documents" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'driver-documents'
    AND split_part(name, '/', 1) = get_org_id()::text
);

-- Inspection remediation tracking enhancements
ALTER TABLE public.inspections
ADD COLUMN IF NOT EXISTS defect_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remediation_status TEXT NOT NULL DEFAULT 'Open' CHECK (remediation_status IN ('Open', 'In Progress', 'Closed')),
ADD COLUMN IF NOT EXISTS remediation_due_date DATE,
ADD COLUMN IF NOT EXISTS remediation_notes TEXT,
ADD COLUMN IF NOT EXISTS inspection_document_path TEXT;

CREATE INDEX IF NOT EXISTS idx_inspections_remediation_status ON public.inspections (remediation_status);
CREATE INDEX IF NOT EXISTS idx_tasks_type_status ON public.tasks (type, status);

ALTER TABLE public.driver_documents
ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type TEXT;
