-- Add motive_id to drivers table for syncing
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS motive_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drivers_motive_id ON drivers(motive_id);
