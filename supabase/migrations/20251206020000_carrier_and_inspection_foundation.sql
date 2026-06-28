CREATE TABLE IF NOT EXISTS public.carrier_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    dot_number TEXT,
    mc_number TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.carrier_health_cache (
    dot_number TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    report_number TEXT,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    vehicle_id UUID,
    basic_category TEXT,
    violation_code TEXT,
    description TEXT,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.carrier_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_health_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'driver_id') THEN
        ALTER TABLE public.tasks ADD COLUMN driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'closed_notes') THEN
        ALTER TABLE public.tasks ADD COLUMN closed_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'closed_at') THEN
        ALTER TABLE public.tasks ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'driver_name') THEN
        ALTER TABLE public.tasks ADD COLUMN driver_name TEXT;
    END IF;
END $$;

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

DROP POLICY IF EXISTS "Allow all for carrier_settings" ON public.carrier_settings;
CREATE POLICY "Allow all for carrier_settings" ON public.carrier_settings
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for carrier_health_cache" ON public.carrier_health_cache;
CREATE POLICY "Allow all for carrier_health_cache" ON public.carrier_health_cache
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read/write for authenticated users only" ON public.inspections;
CREATE POLICY "Enable read/write for authenticated users only" ON public.inspections
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_tasks_driver_id ON public.tasks(driver_id);

GRANT ALL ON public.carrier_settings TO anon, authenticated;
GRANT ALL ON public.carrier_health_cache TO anon, authenticated;

INSERT INTO public.carrier_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
