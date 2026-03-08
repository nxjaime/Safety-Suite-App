-- Sprint 23: Maintenance history, WO closeout fields, parts catalog

-- Maintenance service history (enables PM due calculation against real data)
CREATE TABLE IF NOT EXISTS public.maintenance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.pm_templates(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id),
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    service_date DATE NOT NULL,
    service_miles INT,
    service_hours INT,
    notes TEXT,
    performed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_history_equipment_template_idx
    ON public.maintenance_history (equipment_id, template_id, service_date DESC);
CREATE INDEX IF NOT EXISTS maintenance_history_equipment_date_idx
    ON public.maintenance_history (equipment_id, service_date DESC);
CREATE INDEX IF NOT EXISTS maintenance_history_org_idx
    ON public.maintenance_history (organization_id);

ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Org members can manage maintenance history"
    ON public.maintenance_history FOR ALL
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

-- Work order closeout and repeat-service tracking
ALTER TABLE public.work_orders
    ADD COLUMN IF NOT EXISTS created_from_template_id UUID REFERENCES public.pm_templates(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS repeat_of_work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS closeout_notes TEXT,
    ADD COLUMN IF NOT EXISTS closed_by TEXT;

-- Labor tracking on line items
ALTER TABLE public.work_order_line_items
    ADD COLUMN IF NOT EXISTS labor_hours NUMERIC,
    ADD COLUMN IF NOT EXISTS technician TEXT;

-- Basic parts catalog (foundation for service execution)
CREATE TABLE IF NOT EXISTS public.parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS parts_org_sku_idx
    ON public.parts (organization_id, sku);
CREATE INDEX IF NOT EXISTS parts_org_idx
    ON public.parts (organization_id);

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Org members can manage parts"
    ON public.parts FOR ALL
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
