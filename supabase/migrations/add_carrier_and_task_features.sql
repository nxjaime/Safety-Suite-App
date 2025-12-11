-- Migration: Add Carrier Settings, Carrier Health Cache, and Task Enhancements
-- Run this in your Supabase SQL editor

-- Carrier Settings Table
CREATE TABLE IF NOT EXISTS carrier_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    dot_number TEXT,
    mc_number TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carrier Health Cache Table
CREATE TABLE IF NOT EXISTS carrier_health_cache (
    dot_number TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to tasks table if they don't exist
DO $$
BEGIN
    -- Add driver_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'driver_id') THEN
        ALTER TABLE tasks ADD COLUMN driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
    END IF;

    -- Add closed_notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'closed_notes') THEN
        ALTER TABLE tasks ADD COLUMN closed_notes TEXT;
    END IF;

    -- Add closed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'closed_at') THEN
        ALTER TABLE tasks ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;

    -- Add driver_name column for denormalization (optional but helpful)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'driver_name') THEN
        ALTER TABLE tasks ADD COLUMN driver_name TEXT;
    END IF;
END $$;

-- Enable RLS (Row Level Security) for new tables
ALTER TABLE carrier_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_health_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for carrier_settings (allow all for authenticated users for now)
CREATE POLICY IF NOT EXISTS "Allow all for carrier_settings" ON carrier_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for carrier_health_cache
CREATE POLICY IF NOT EXISTS "Allow all for carrier_health_cache" ON carrier_health_cache
    FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster task lookups by driver
CREATE INDEX IF NOT EXISTS idx_tasks_driver_id ON tasks(driver_id);

-- Grant access to anon and authenticated roles
GRANT ALL ON carrier_settings TO anon, authenticated;
GRANT ALL ON carrier_health_cache TO anon, authenticated;

-- Insert default carrier settings row if not exists
INSERT INTO carrier_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
