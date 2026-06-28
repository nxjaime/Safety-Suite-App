ALTER TABLE public.carrier_settings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.carrier_health_cache
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
