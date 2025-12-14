-- Add license and medical info columns to drivers table
ALTER TABLE "public"."drivers" 
ADD COLUMN "license_state" text,
ADD COLUMN "license_restrictions" text,
ADD COLUMN "license_endorsements" text,
ADD COLUMN "license_expiration_date" date,
ADD COLUMN "medical_card_issue_date" date,
ADD COLUMN "medical_card_expiration_date" date,
ADD COLUMN "cpap_required" boolean DEFAULT false;
