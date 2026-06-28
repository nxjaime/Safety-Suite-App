-- Add license and medical info columns to drivers table
ALTER TABLE "public"."drivers" 
ADD COLUMN IF NOT EXISTS "license_state" text,
ADD COLUMN IF NOT EXISTS "license_restrictions" text,
ADD COLUMN IF NOT EXISTS "license_endorsements" text,
ADD COLUMN IF NOT EXISTS "license_expiration_date" date,
ADD COLUMN IF NOT EXISTS "medical_card_issue_date" date,
ADD COLUMN IF NOT EXISTS "medical_card_expiration_date" date,
ADD COLUMN IF NOT EXISTS "cpap_required" boolean DEFAULT false;
