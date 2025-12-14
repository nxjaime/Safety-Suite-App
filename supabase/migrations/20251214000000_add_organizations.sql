-- Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create Profiles Table (to link users to organizations)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    role TEXT DEFAULT 'admin',
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add organization_id to existing tables
DO $$
BEGIN
    -- Drivers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'organization_id') THEN
        ALTER TABLE drivers ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    -- Accidents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accidents' AND column_name = 'organization_id') THEN
        ALTER TABLE accidents ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    -- Citations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'citations' AND column_name = 'organization_id') THEN
        ALTER TABLE citations ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    -- Risk Events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_events' AND column_name = 'organization_id') THEN
        ALTER TABLE risk_events ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    -- Tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'organization_id') THEN
        ALTER TABLE tasks ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    -- Coaching Plans
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coaching_plans' AND column_name = 'organization_id') THEN
        ALTER TABLE coaching_plans ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    -- Driver Documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_documents' AND column_name = 'organization_id') THEN
        ALTER TABLE driver_documents ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- Update RLS Policies to check organization_id
-- NOTE: In a real deployment, we would drop existing "Public" policies first. 
-- For this migration, we are adding new restrictive policies.

-- Policy Helper Function (optional, but good practice)
-- CREATE OR REPLACE FUNCTION get_org_id() RETURNS UUID AS $$
--   SELECT organization_id FROM profiles WHERE id = auth.uid()
-- $$ LANGUAGE sql SECURITY DEFINER;

-- Example Policy Pattern (apply this to all tables)
-- CREATE POLICY "Org Access" ON drivers
--   USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- For now, we will just ensure the column exists. Implementation of strict RLS enforcement 
-- might require data migration if there is existing data without org_ids.
