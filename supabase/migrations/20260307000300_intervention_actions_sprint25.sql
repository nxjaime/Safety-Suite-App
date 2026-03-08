-- Sprint 25: Intervention action tracking for coaching/safety lifecycle
-- ============================================================================

-- Track dispositions on intervention queue items
CREATE TABLE IF NOT EXISTS intervention_actions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id       uuid REFERENCES drivers(id) ON DELETE CASCADE,
    action          text NOT NULL CHECK (action IN ('accepted', 'dismissed', 'converted_to_coaching')),
    reason          text,
    actor           text,
    coaching_plan_id uuid REFERENCES coaching_plans(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE intervention_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON intervention_actions
    USING (organization_id = (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE INDEX IF NOT EXISTS idx_intervention_actions_driver
    ON intervention_actions (organization_id, driver_id, created_at DESC);

-- Add outcome field to coaching_plans for close-loop tracking
ALTER TABLE coaching_plans
    ADD COLUMN IF NOT EXISTS outcome_notes text,
    ADD COLUMN IF NOT EXISTS closed_by     text,
    ADD COLUMN IF NOT EXISTS closed_at     timestamptz;
