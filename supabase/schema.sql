-- Create Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT CHECK (status IN ('Active', 'Inactive', 'On Leave')),
    terminal TEXT,
    risk_score INTEGER DEFAULT 0,
    years_of_service INTEGER,
    employee_id TEXT,
    image TEXT,
    address TEXT,
    ssn TEXT,
    phone TEXT,
    license_number TEXT,
    email TEXT,
    hire_date DATE,
    notes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Accidents Table
CREATE TABLE IF NOT EXISTS accidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    preventable BOOLEAN DEFAULT FALSE,
    severity TEXT CHECK (severity IN ('Minor', 'Moderate', 'Major')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Citations Table
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Risk Events Table (for custom logged events)
CREATE TABLE IF NOT EXISTS risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    points INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    assignee TEXT,
    type TEXT DEFAULT 'General',
    related_id UUID, -- Can link to driver or plan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Coaching Plans Table
CREATE TABLE IF NOT EXISTS coaching_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    type TEXT,
    start_date DATE,
    duration_weeks INTEGER,
    status TEXT CHECK (status IN ('Active', 'Completed', 'Terminated')),
    weekly_check_ins JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_plans ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public access for now since auth isn't fully set up for users)
CREATE POLICY "Public Read" ON drivers FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON drivers FOR UPDATE USING (true);

CREATE POLICY "Public Read" ON accidents FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON accidents FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read" ON citations FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON citations FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read" ON risk_events FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON risk_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON tasks FOR UPDATE USING (true);

CREATE POLICY "Public Read" ON coaching_plans FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON coaching_plans FOR INSERT WITH CHECK (true);

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
