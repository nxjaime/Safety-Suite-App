-- Add vehicle-specific fields and enums to equipment

DO $$ BEGIN
  CREATE TYPE own_lease_enum AS ENUM ('Own', 'Lease', 'Rent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE eld_logging_enum AS ENUM ('Enabled', 'Disabled', 'Exempt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type_enum AS ENUM ('Sales Vehicle', 'Truck', 'Trailer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE us_state_enum AS ENUM (
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT',
    'NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS removed_from_fleet DATE,
  ADD COLUMN IF NOT EXISTS added_to_fleet DATE,
  ADD COLUMN IF NOT EXISTS div_number TEXT,
  ADD COLUMN IF NOT EXISTS division TEXT,
  ADD COLUMN IF NOT EXISTS corp TEXT,
  ADD COLUMN IF NOT EXISTS own_lease own_lease_enum,
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state us_state_enum,
  ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
  ADD COLUMN IF NOT EXISTS vin TEXT,
  ADD COLUMN IF NOT EXISTS ins_class TEXT,
  ADD COLUMN IF NOT EXISTS gl_acct TEXT,
  ADD COLUMN IF NOT EXISTS gross_weight INT,
  ADD COLUMN IF NOT EXISTS geotab TEXT,
  ADD COLUMN IF NOT EXISTS toll_transponder TEXT,
  ADD COLUMN IF NOT EXISTS driver TEXT,
  ADD COLUMN IF NOT EXISTS rep_code TEXT,
  ADD COLUMN IF NOT EXISTS driver_check_number TEXT,
  ADD COLUMN IF NOT EXISTS mth_lease_charge NUMERIC,
  ADD COLUMN IF NOT EXISTS mileage_charge NUMERIC,
  ADD COLUMN IF NOT EXISTS follow_up DATE,
  ADD COLUMN IF NOT EXISTS lease_expir_year INT,
  ADD COLUMN IF NOT EXISTS vehicle_value NUMERIC,
  ADD COLUMN IF NOT EXISTS license_plate TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS months_in_service INT,
  ADD COLUMN IF NOT EXISTS as_of_date DATE,
  ADD COLUMN IF NOT EXISTS avg_miles_per_month INT,
  ADD COLUMN IF NOT EXISTS estimated_odometer_6mo INT,
  ADD COLUMN IF NOT EXISTS mgr TEXT,
  ADD COLUMN IF NOT EXISTS eld_logging eld_logging_enum,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS imei TEXT,
  ADD COLUMN IF NOT EXISTS eld_notes TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_type vehicle_type_enum;
