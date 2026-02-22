-- Fleet operations core tables: equipment, PM templates, work orders

CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    asset_tag TEXT NOT NULL,
    type TEXT NOT NULL,
    ownership_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    make TEXT,
    model TEXT,
    year INT,
    usage_miles INT,
    usage_hours INT,
    attachments JSONB,
    forklift_attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS equipment_org_asset_tag_idx
    ON public.equipment (organization_id, asset_tag);
CREATE INDEX IF NOT EXISTS equipment_org_idx
    ON public.equipment (organization_id);

CREATE TABLE IF NOT EXISTS public.pm_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    applies_to_type TEXT,
    interval_days INT,
    interval_miles INT,
    interval_hours INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pm_templates_org_idx
    ON public.pm_templates (organization_id);

CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    equipment_id UUID REFERENCES equipment(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Draft',
    priority TEXT NOT NULL DEFAULT 'Medium',
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    assigned_to TEXT,
    due_date DATE,
    total_parts_cost NUMERIC,
    total_labor_cost NUMERIC,
    total_cost NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_orders_org_idx
    ON public.work_orders (organization_id);
CREATE INDEX IF NOT EXISTS work_orders_equipment_idx
    ON public.work_orders (equipment_id);

CREATE TABLE IF NOT EXISTS public.work_order_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    total_cost NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_order_line_items_work_order_idx
    ON public.work_order_line_items (work_order_id);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Enable read/write for all users" ON public.equipment
    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable read/write for all users" ON public.pm_templates
    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable read/write for all users" ON public.work_orders
    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable read/write for all users" ON public.work_order_line_items
    FOR ALL USING (true) WITH CHECK (true);
