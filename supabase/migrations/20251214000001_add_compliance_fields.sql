-- Add Compliance Fields to Drivers Table
DO $$
BEGIN
    -- License State
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_state') THEN
        ALTER TABLE drivers ADD COLUMN license_state TEXT;
    END IF;

    -- License Restrictions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_restrictions') THEN
        ALTER TABLE drivers ADD COLUMN license_restrictions TEXT;
    END IF;

    -- License Endorsements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_endorsements') THEN
        ALTER TABLE drivers ADD COLUMN license_endorsements TEXT;
    END IF;

    -- License Expiration Date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_expiration_date') THEN
        ALTER TABLE drivers ADD COLUMN license_expiration_date DATE;
    END IF;

    -- Medical Card Issue Date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'medical_card_issue_date') THEN
        ALTER TABLE drivers ADD COLUMN medical_card_issue_date DATE;
    END IF;

    -- Medical Card Expiration Date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'medical_card_expiration_date') THEN
        ALTER TABLE drivers ADD COLUMN medical_card_expiration_date DATE;
    END IF;

    -- CPAP Required
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'cpap_required') THEN
        ALTER TABLE drivers ADD COLUMN cpap_required BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
