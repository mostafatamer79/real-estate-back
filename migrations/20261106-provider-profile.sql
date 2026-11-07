-- Apply before deploying the provider application, after a verified database backup.
-- Rerunnable; ALTER TYPE takes a table lock. Schedule a maintenance window.
-- The monetary price column retains its existing values and now supports cents.
-- Existing accounts retain their roles, permissions and financial agreements.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "providerProfile" jsonb;
ALTER TABLE service_requests ALTER COLUMN price TYPE numeric(12,2) USING price::numeric(12,2);
COMMIT;
-- Roll back application code first. Leave the nullable column to preserve reviews.
