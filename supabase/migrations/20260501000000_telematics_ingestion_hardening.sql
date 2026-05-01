-- Sprint 38: Telematics hardening and real-time event reliability

CREATE TABLE IF NOT EXISTS telematics_event_buffer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  provider TEXT NOT NULL,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  event_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'buffered',
  retry_count INTEGER NOT NULL DEFAULT 0,
  dedup_count INTEGER NOT NULL DEFAULT 0,
  is_out_of_order BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  last_error TEXT,
  dropped_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE telematics_event_buffer
  DROP CONSTRAINT IF EXISTS telematics_event_buffer_status_check;
ALTER TABLE telematics_event_buffer
  ADD CONSTRAINT telematics_event_buffer_status_check CHECK (status IN ('buffered', 'processed', 'retry', 'dropped'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_telematics_event_buffer_unique_event
  ON telematics_event_buffer (organization_id, provider, event_key);
CREATE INDEX IF NOT EXISTS idx_telematics_event_buffer_org_provider_status
  ON telematics_event_buffer (organization_id, provider, status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_telematics_event_buffer_driver_timestamp
  ON telematics_event_buffer (driver_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telematics_event_buffer_processed
  ON telematics_event_buffer (organization_id, provider, processed_at DESC);

ALTER TABLE telematics_event_buffer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read" ON telematics_event_buffer;
DROP POLICY IF EXISTS "Public Insert" ON telematics_event_buffer;
DROP POLICY IF EXISTS "Public Update" ON telematics_event_buffer;
DROP POLICY IF EXISTS "Public Delete" ON telematics_event_buffer;
DROP POLICY IF EXISTS "Org Access Telematics Event Buffer" ON telematics_event_buffer;

CREATE POLICY "Org Access Telematics Event Buffer" ON telematics_event_buffer
  FOR ALL
  USING (organization_id = get_org_id())
  WITH CHECK (organization_id = get_org_id());
