-- Secure RLS Policies Migration
-- Date: 2026-02-14

-- 1. Create Helper Function to get current user's organization_id
CREATE OR REPLACE FUNCTION get_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT organization_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Missing Organization ID Columns (Carrier tables were missed in previous migration)
DO $$
BEGIN
    -- Carrier Settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carrier_settings' AND column_name = 'organization_id') THEN
        ALTER TABLE carrier_settings ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    -- Carrier Health Cache
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carrier_health_cache' AND column_name = 'organization_id') THEN
        ALTER TABLE carrier_health_cache ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;

    -- Inspections (just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspections' AND column_name = 'organization_id') THEN
        ALTER TABLE inspections ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;


-- 3. Drop Insecure Policies (cleanup)
DROP POLICY IF EXISTS "Public Read" ON drivers;
DROP POLICY IF EXISTS "Public Insert" ON drivers;
DROP POLICY IF EXISTS "Public Update" ON drivers;
DROP POLICY IF EXISTS "Drivers accessible by organization" ON drivers;

DROP POLICY IF EXISTS "Public Read" ON accidents;
DROP POLICY IF EXISTS "Public Insert" ON accidents;
DROP POLICY IF EXISTS "Public Update" ON accidents;

DROP POLICY IF EXISTS "Public Read" ON citations;
DROP POLICY IF EXISTS "Public Insert" ON citations;
DROP POLICY IF EXISTS "Public Update" ON citations;

DROP POLICY IF EXISTS "Public Read" ON risk_events;
DROP POLICY IF EXISTS "Public Insert" ON risk_events;
DROP POLICY IF EXISTS "Public Update" ON risk_events;

DROP POLICY IF EXISTS "Public Read" ON tasks;
DROP POLICY IF EXISTS "Public Insert" ON tasks;
DROP POLICY IF EXISTS "Public Update" ON tasks;
DROP POLICY IF EXISTS "Public Delete" ON tasks;

DROP POLICY IF EXISTS "Public Read" ON coaching_plans;
DROP POLICY IF EXISTS "Public Insert" ON coaching_plans;
DROP POLICY IF EXISTS "Public Update" ON coaching_plans;
DROP POLICY IF EXISTS "Public Delete" ON coaching_plans;

DROP POLICY IF EXISTS "Public Read Documents" ON driver_documents;
DROP POLICY IF EXISTS "Public Insert Documents" ON driver_documents;
DROP POLICY IF EXISTS "Public Delete Documents" ON driver_documents;

DROP POLICY IF EXISTS "Public Read" ON carrier_settings;
DROP POLICY IF EXISTS "Public Insert" ON carrier_settings;
DROP POLICY IF EXISTS "Public Update" ON carrier_settings;
DROP POLICY IF EXISTS "Allow all for carrier_settings" ON carrier_settings;

DROP POLICY IF EXISTS "Public Read" ON carrier_health_cache;
DROP POLICY IF EXISTS "Public Insert" ON carrier_health_cache;
DROP POLICY IF EXISTS "Public Update" ON carrier_health_cache;
DROP POLICY IF EXISTS "Allow all for carrier_health_cache" ON carrier_health_cache;

DROP POLICY IF EXISTS "Public Read" ON inspections;
DROP POLICY IF EXISTS "Public Insert" ON inspections;
DROP POLICY IF EXISTS "Public Update" ON inspections;

-- 4. Create Secure Policies

-- Profiles: Users can read/update their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles
    USING (auth.uid() = id);

-- Organizations: Users can read their own organization
DROP POLICY IF EXISTS "Users can read own organization" ON organizations;
CREATE POLICY "Users can read own organization" ON organizations
    FOR SELECT
    USING (id = get_org_id());

-- Drivers: Org isolation
DROP POLICY IF EXISTS "Org Access Drivers" ON drivers;
CREATE POLICY "Org Access Drivers" ON drivers
    USING (organization_id = get_org_id());

-- Accidents: Org isolation
DROP POLICY IF EXISTS "Org Access Accidents" ON accidents;
CREATE POLICY "Org Access Accidents" ON accidents
    USING (organization_id = get_org_id());

-- Citations: Org isolation
DROP POLICY IF EXISTS "Org Access Citations" ON citations;
CREATE POLICY "Org Access Citations" ON citations
    USING (organization_id = get_org_id());

-- Risk Events: Org isolation
DROP POLICY IF EXISTS "Org Access Risk Events" ON risk_events;
CREATE POLICY "Org Access Risk Events" ON risk_events
    USING (organization_id = get_org_id());

-- Tasks: Org isolation
DROP POLICY IF EXISTS "Org Access Tasks" ON tasks;
CREATE POLICY "Org Access Tasks" ON tasks
    USING (organization_id = get_org_id());

-- Coaching Plans: Org isolation
DROP POLICY IF EXISTS "Org Access Coaching Plans" ON coaching_plans;
CREATE POLICY "Org Access Coaching Plans" ON coaching_plans
    USING (organization_id = get_org_id());

-- Driver Documents: Org isolation
DROP POLICY IF EXISTS "Org Access Driver Documents" ON driver_documents;
CREATE POLICY "Org Access Driver Documents" ON driver_documents
    USING (organization_id = get_org_id());

-- Carrier Settings: Org isolation
DROP POLICY IF EXISTS "Org Access Carrier Settings" ON carrier_settings;
CREATE POLICY "Org Access Carrier Settings" ON carrier_settings
    USING (organization_id = get_org_id());

-- Carrier Health Cache: Org isolation
DROP POLICY IF EXISTS "Org Access Carrier Health Cache" ON carrier_health_cache;
CREATE POLICY "Org Access Carrier Health Cache" ON carrier_health_cache
    USING (organization_id = get_org_id());

-- Inspections: Org isolation
DROP POLICY IF EXISTS "Org Access Inspections" ON inspections;
CREATE POLICY "Org Access Inspections" ON inspections
    USING (organization_id = get_org_id());
