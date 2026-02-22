-- Sprint 4: Risk events normalization + risk score history

-- Ensure required columns exist for normalized risk_events.
ALTER TABLE risk_events
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS severity SMALLINT,
  ADD COLUMN IF NOT EXISTS score_delta INTEGER,
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Backfill normalized fields from legacy columns when present.
UPDATE risk_events
SET
  event_type = COALESCE(event_type, type),
  occurred_at = COALESCE(occurred_at, date::timestamptz, created_at),
  score_delta = COALESCE(score_delta, points),
  metadata = CASE
    WHEN metadata IS NOT NULL AND metadata <> '{}'::jsonb THEN metadata
    WHEN notes IS NOT NULL THEN jsonb_build_object('notes', notes)
    ELSE '{}'::jsonb
  END
WHERE event_type IS NULL
   OR occurred_at IS NULL
   OR score_delta IS NULL
   OR metadata IS NULL
   OR metadata = '{}'::jsonb;

-- Sensible defaults for rows without explicit severity.
UPDATE risk_events
SET severity = COALESCE(severity, 1)
WHERE severity IS NULL;

-- Safety constraints.
ALTER TABLE risk_events
  DROP CONSTRAINT IF EXISTS risk_events_severity_check;
ALTER TABLE risk_events
  ADD CONSTRAINT risk_events_severity_check CHECK (severity BETWEEN 1 AND 5);

-- Performance indexes for risk lookups.
CREATE INDEX IF NOT EXISTS idx_risk_events_driver_occurred_at_desc
  ON risk_events (driver_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_events_organization
  ON risk_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_events_source
  ON risk_events (source);

-- Score history table.
CREATE TABLE IF NOT EXISTS driver_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  score INTEGER NOT NULL,
  composite_parts JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_window TEXT NOT NULL DEFAULT '90d',
  as_of TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE driver_risk_scores
  DROP CONSTRAINT IF EXISTS driver_risk_scores_score_check;
ALTER TABLE driver_risk_scores
  ADD CONSTRAINT driver_risk_scores_score_check CHECK (score BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_driver_risk_scores_driver_as_of_desc
  ON driver_risk_scores (driver_id, as_of DESC);
CREATE INDEX IF NOT EXISTS idx_driver_risk_scores_organization
  ON driver_risk_scores (organization_id);

-- RLS enforcement for both risk tables.
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_risk_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read" ON risk_events;
DROP POLICY IF EXISTS "Public Insert" ON risk_events;
DROP POLICY IF EXISTS "Public Update" ON risk_events;
DROP POLICY IF EXISTS "Public Delete" ON risk_events;

DROP POLICY IF EXISTS "Public Read" ON driver_risk_scores;
DROP POLICY IF EXISTS "Public Insert" ON driver_risk_scores;
DROP POLICY IF EXISTS "Public Update" ON driver_risk_scores;
DROP POLICY IF EXISTS "Public Delete" ON driver_risk_scores;

DROP POLICY IF EXISTS "Public Read" ON coaching_plans;
DROP POLICY IF EXISTS "Public Insert" ON coaching_plans;
DROP POLICY IF EXISTS "Public Update" ON coaching_plans;
DROP POLICY IF EXISTS "Public Delete" ON coaching_plans;

DROP POLICY IF EXISTS "Org Access Risk Events" ON risk_events;
CREATE POLICY "Org Access Risk Events" ON risk_events
  FOR ALL
  USING (organization_id = get_org_id())
  WITH CHECK (organization_id = get_org_id());

DROP POLICY IF EXISTS "Org Access Driver Risk Scores" ON driver_risk_scores;
CREATE POLICY "Org Access Driver Risk Scores" ON driver_risk_scores
  FOR ALL
  USING (organization_id = get_org_id())
  WITH CHECK (organization_id = get_org_id());

DROP POLICY IF EXISTS "Org Access Coaching Plans" ON coaching_plans;
CREATE POLICY "Org Access Coaching Plans" ON coaching_plans
  FOR ALL
  USING (organization_id = get_org_id())
  WITH CHECK (organization_id = get_org_id());

-- Seed risk type system options without duplicates.
INSERT INTO system_options (category, label, value)
SELECT 'risk_type', seeded.label, seeded.value
FROM (
  VALUES
    ('Speeding', 'Speeding'),
    ('Hard Braking', 'Hard Braking'),
    ('HOS Violation', 'HOS Violation'),
    ('Accident', 'Accident'),
    ('Citation', 'Citation')
) AS seeded(label, value)
WHERE NOT EXISTS (
  SELECT 1
  FROM system_options so
  WHERE so.category = 'risk_type'
    AND so.value = seeded.value
);
