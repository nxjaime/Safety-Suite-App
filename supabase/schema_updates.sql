
-- System Options Table for Customizable Dropdowns
CREATE TABLE system_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- e.g., 'vehicle_type', 'risk_type', 'training_module'
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for system_options
ALTER TABLE system_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON system_options
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON system_options
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_system_options_category ON system_options(category);

-- Seed Data for Vehicle Types
INSERT INTO system_options (category, label, value) VALUES
('vehicle_type', 'Tractor', 'Tractor'),
('vehicle_type', 'Trailer', 'Trailer'),
('vehicle_type', 'Box Truck', 'Box Truck'),
('vehicle_type', 'Company Vehicle', 'Company Vehicle'), -- Requested Item
('vehicle_type', 'Forklift', 'Forklift');

-- Seed Data for Risk Types
INSERT INTO system_options (category, label, value) VALUES
('risk_type', 'Speeding', 'Speeding'),
('risk_type', 'Hard Braking', 'Hard Braking'),
('risk_type', 'HOS Violation', 'HOS Violation'),
('risk_type', 'Accident', 'Accident'),
('risk_type', 'Citation', 'Citation');
