-- Sprint 26: Training corrective action and manager review layer
-- ============================================================================

-- Add trigger type and escalation tracking to training_assignments
ALTER TABLE training_assignments
    ADD COLUMN IF NOT EXISTS trigger_type  text CHECK (trigger_type IN ('manual', 'risk_event', 'coaching_plan', 'policy')) DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS escalated_at  timestamptz;

-- Index: overdue open assignments for manager review queue
CREATE INDEX IF NOT EXISTS idx_training_assignments_overdue
    ON training_assignments (organization_id, due_date, status)
    WHERE status != 'Completed';

-- Index: unreviewed completions for manager review queue
CREATE INDEX IF NOT EXISTS idx_training_assignments_unreviewed
    ON training_assignments (organization_id, completed_at)
    WHERE status = 'Completed' AND reviewed_at IS NULL;
