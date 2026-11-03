-- Apply BEFORE deploying the new backend. Additive; existing MFA rows remain untrusted.
BEGIN;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nafathVerifiedAt" timestamp NULL;
ALTER TABLE "nafath_transactions" ADD COLUMN IF NOT EXISTS "hashedState" varchar NULL;
ALTER TABLE "nafath_transactions" ADD COLUMN IF NOT EXISTS "endUserIp" varchar NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_nafath_transactions_hashedState" ON "nafath_transactions" ("hashedState");
COMMIT;
-- No backfill: email OTP, names, admin flags and old MFA rows are not proof of OIDC verification.
-- Rollback application code first. Keeping these nullable columns is safe for the previous version.
