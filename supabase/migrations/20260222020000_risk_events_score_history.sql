-- Risk events and driver risk score history

CREATE TABLE IF NOT EXISTS public.risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id),
    organization_id UUID REFERENCES organizations(id),
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 5),
    score_delta INT,
    occurred_at TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS risk_events_driver_occurred_idx ON public.risk_events (driver_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS risk_events_org_idx ON public.risk_events (organization_id);
CREATE INDEX IF NOT EXISTS risk_events_source_idx ON public.risk_events (source);

CREATE TABLE IF NOT EXISTS public.driver_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id),
    organization_id UUID REFERENCES organizations(id),
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    composite_parts JSONB,
    source_window TEXT DEFAULT '90d',
    as_of TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS driver_risk_scores_driver_idx ON public.driver_risk_scores (driver_id, as_of DESC);
CREATE INDEX IF NOT EXISTS driver_risk_scores_org_idx ON public.driver_risk_scores (organization_id);

-- Enable RLS
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_risk_scores ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies if they exist
DROP POLICY IF EXISTS "Public Read" ON public.risk_events;
DROP POLICY IF EXISTS "Public Insert" ON public.risk_events;
DROP POLICY IF EXISTS "Public Update" ON public.risk_events;
DROP POLICY IF EXISTS "Public Delete" ON public.risk_events;
DROP POLICY IF EXISTS "Public Read" ON public.driver_risk_scores;
DROP POLICY IF EXISTS "Public Insert" ON public.driver_risk_scores;
DROP POLICY IF EXISTS "Public Update" ON public.driver_risk_scores;
DROP POLICY IF EXISTS "Public Delete" ON public.driver_risk_scores;

-- Org-scoped policies
CREATE POLICY IF NOT EXISTS "Org Access Risk Events" ON public.risk_events
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Org Access Driver Risk Scores" ON public.driver_risk_scores
    USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Seed risk types if missing
INSERT INTO system_options (category, label, value)
SELECT 'risk_type', v, v FROM (VALUES
    ('Speeding'),
    ('Hard Braking'),
    ('HOS Violation'),
    ('Accident'),
    ('Citation')
) AS t(v)
WHERE NOT EXISTS (
    SELECT 1 FROM system_options so WHERE so.category = 'risk_type' AND so.value = v
);
