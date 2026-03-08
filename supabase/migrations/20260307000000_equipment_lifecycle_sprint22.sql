-- Sprint 22: Equipment lifecycle columns and status history table

-- Add lifecycle columns to equipment
ALTER TABLE public.equipment
    ADD COLUMN IF NOT EXISTS next_service_date DATE,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ;

-- Expand allowed status values (additive constraint; existing 'active'/'inactive'/'out_of_service' remain valid)
DO $$
BEGIN
    ALTER TABLE public.equipment
        ADD CONSTRAINT equipment_status_check
        CHECK (status IN ('active', 'inactive', 'out_of_service', 'maintenance', 'archived', 'retired'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

-- Status history table for lifecycle audit trail
CREATE TABLE IF NOT EXISTS public.equipment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS equipment_status_history_equipment_idx
    ON public.equipment_status_history (equipment_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS equipment_status_history_org_idx
    ON public.equipment_status_history (organization_id);

ALTER TABLE public.equipment_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Org members can manage equipment status history"
    ON public.equipment_status_history
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Add equipment linkage to documents table
ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS linked_equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_equipment
    ON public.documents (linked_equipment_id)
    WHERE linked_equipment_id IS NOT NULL;
