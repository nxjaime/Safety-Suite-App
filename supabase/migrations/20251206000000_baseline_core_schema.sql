CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.drivers (
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

CREATE TABLE IF NOT EXISTS public.accidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    preventable BOOLEAN DEFAULT FALSE,
    severity TEXT CHECK (severity IN ('Minor', 'Moderate', 'Major')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    points INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    assignee TEXT,
    type TEXT DEFAULT 'General',
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coaching_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    type TEXT,
    start_date DATE,
    duration_weeks INTEGER,
    status TEXT CHECK (status IN ('Active', 'Completed', 'Terminated')),
    weekly_check_ins JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    url TEXT,
    notes TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON public.drivers FOR UPDATE USING (true);

CREATE POLICY "Public Read" ON public.accidents FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.accidents FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read" ON public.citations FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.citations FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read" ON public.risk_events FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.risk_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON public.tasks FOR UPDATE USING (true);

CREATE POLICY "Public Read" ON public.coaching_plans FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.coaching_plans FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Documents" ON public.driver_documents FOR SELECT USING (true);
CREATE POLICY "Public Insert Documents" ON public.driver_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Documents" ON public.driver_documents FOR DELETE USING (true);
