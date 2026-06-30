-- Sprint 61: store inspection display names captured from DVER forms.

ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_name TEXT;
