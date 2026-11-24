BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE management_packages
  ADD COLUMN IF NOT EXISTS "discountPeriod" varchar(7) NOT NULL DEFAULT 'both';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'CHK_management_packages_discount_period'
      AND conrelid = 'management_packages'::regclass
  ) THEN
    ALTER TABLE management_packages
      ADD CONSTRAINT "CHK_management_packages_discount_period"
      CHECK ("discountPeriod" IN ('both', 'monthly', 'yearly'));
  END IF;
END $$;
COMMIT;
