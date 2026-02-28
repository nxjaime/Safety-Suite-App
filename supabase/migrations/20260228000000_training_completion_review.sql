-- Sprint 13: Training assignment completion, attestation, and optional risk/coaching linkage

ALTER TABLE training_assignments
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completion_notes text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Optional linkage for "assign training from risk event / coaching plan" (Option A; plain uuid to avoid migration order dependency)
ALTER TABLE training_assignments
  ADD COLUMN IF NOT EXISTS risk_event_id uuid,
  ADD COLUMN IF NOT EXISTS coaching_plan_id uuid;
