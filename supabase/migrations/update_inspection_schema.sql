-- Upgrade inspections table to support detailed DVER fields

ALTER TABLE public.inspections
ADD COLUMN IF NOT EXISTS time_started TIME,
ADD COLUMN IF NOT EXISTS time_ended TIME,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS inspection_level TEXT,
ADD COLUMN IF NOT EXISTS officer_name TEXT,
ADD COLUMN IF NOT EXISTS badge_number TEXT,

ADD COLUMN IF NOT EXISTS carrier_name TEXT,
ADD COLUMN IF NOT EXISTS carrier_address TEXT,
ADD COLUMN IF NOT EXISTS usdot_number TEXT,

ADD COLUMN IF NOT EXISTS driver_dob DATE,
ADD COLUMN IF NOT EXISTS driver_license_number TEXT,
ADD COLUMN IF NOT EXISTS driver_license_state TEXT,
ADD COLUMN IF NOT EXISTS medical_cert_status TEXT,

ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS plate_number TEXT,
ADD COLUMN IF NOT EXISTS plate_state TEXT,
ADD COLUMN IF NOT EXISTS vin TEXT,
ADD COLUMN IF NOT EXISTS odometer TEXT,
ADD COLUMN IF NOT EXISTS cargo_info TEXT,

ADD COLUMN IF NOT EXISTS violations_data JSONB DEFAULT '[]'::jsonb;

-- We will use violations_data to store the array of violation objects:
-- { code: string, description: string, type: 'Driver'|'Vehicle', oos: boolean }
