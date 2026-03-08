-- Sprint 24: Inspection remediation closeout + compliance task escalation
-- ============================================================================

-- Add remediation ownership and closeout fields to inspections
ALTER TABLE inspections
    ADD COLUMN IF NOT EXISTS remediation_owner       text,
    ADD COLUMN IF NOT EXISTS remediation_closed_by   text,
    ADD COLUMN IF NOT EXISTS remediation_closed_at   timestamptz,
    ADD COLUMN IF NOT EXISTS remediation_evidence    text;

-- Add escalation timestamp to tasks (used for overdue compliance tasks)
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

-- Index: open remediations lookup
CREATE INDEX IF NOT EXISTS idx_inspections_remediation_status
    ON inspections (organization_id, remediation_status)
    WHERE remediation_status IN ('Open', 'In Progress');

-- Index: out-of-service inspections (for OOS asset surfacing)
CREATE INDEX IF NOT EXISTS idx_inspections_oos
    ON inspections (organization_id, out_of_service)
    WHERE out_of_service = true;
