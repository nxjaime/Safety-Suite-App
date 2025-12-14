-- Enable anonymous access for inspections
DROP POLICY IF EXISTS "Enable read/write for authenticated users only" ON public.inspections;

CREATE POLICY "Enable read/write for all users" ON public.inspections
    FOR ALL USING (true) WITH CHECK (true);

-- Ensure carrier_settings also allows anon if not already
DROP POLICY IF EXISTS "Enable read access for all users" ON public.carrier_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.carrier_settings;

CREATE POLICY "Enable read/write for all users" ON public.carrier_settings
     FOR ALL USING (true) WITH CHECK (true);
