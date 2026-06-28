CREATE TABLE IF NOT EXISTS public.system_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.system_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON public.system_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.system_options
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_system_options_category ON public.system_options(category);

INSERT INTO public.system_options (category, label, value) VALUES
('vehicle_type', 'Tractor', 'Tractor'),
('vehicle_type', 'Trailer', 'Trailer'),
('vehicle_type', 'Box Truck', 'Box Truck'),
('vehicle_type', 'Company Vehicle', 'Company Vehicle'),
('vehicle_type', 'Forklift', 'Forklift'),
('risk_type', 'Speeding', 'Speeding'),
('risk_type', 'Hard Braking', 'Hard Braking'),
('risk_type', 'HOS Violation', 'HOS Violation'),
('risk_type', 'Accident', 'Accident'),
('risk_type', 'Citation', 'Citation')
ON CONFLICT DO NOTHING;
