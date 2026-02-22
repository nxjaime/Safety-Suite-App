ALTER TABLE public.inspections
ADD COLUMN IF NOT EXISTS out_of_service BOOLEAN DEFAULT false;
