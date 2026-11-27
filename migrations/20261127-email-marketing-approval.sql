-- Add approval workflow, publication fee, and canonical invoice columns to email_marketing.
-- Existing ads are moved to pending + inactive so no legacy record can remain published for free.
-- Additive and rerunnable; existing records are preserved without charging or deleting.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.email_marketing
  ADD COLUMN IF NOT EXISTS "approvalStatus" varchar(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "publicationFee" decimal(14,2),
  ADD COLUMN IF NOT EXISTS "invoiceId" uuid;

ALTER TABLE public.email_marketing
  ALTER COLUMN "isActive" SET DEFAULT false;

UPDATE public.email_marketing
SET
  "approvalStatus" = 'pending',
  "isActive" = false
WHERE "invoiceId" IS NULL
  AND ("approvalStatus" IS NULL OR "approvalStatus" <> 'pending' OR "isActive" = true);

COMMIT;
