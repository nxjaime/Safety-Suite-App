-- Create Driver Documents Table
CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT, -- 'Medical', 'License', 'Training', 'Warning', 'Other'
    url TEXT,
    notes TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Documents" ON driver_documents FOR SELECT USING (true);
CREATE POLICY "Public Insert Documents" ON driver_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Documents" ON driver_documents FOR DELETE USING (true);
