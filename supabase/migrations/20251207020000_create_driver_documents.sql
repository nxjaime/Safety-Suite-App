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

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Documents" ON public.driver_documents;
CREATE POLICY "Public Read Documents" ON public.driver_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Documents" ON public.driver_documents;
CREATE POLICY "Public Insert Documents" ON public.driver_documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Delete Documents" ON public.driver_documents;
CREATE POLICY "Public Delete Documents" ON public.driver_documents FOR DELETE USING (true);
