-- Add missing user fields required by the current backend.
-- Additive and rerunnable; existing user data is preserved.
BEGIN;
SET LOCAL lock_timeout = '5s';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'users_requestedRole_enum'
  ) THEN
    CREATE TYPE public."users_requestedRole_enum" AS ENUM (
      'admin', 'user', 'manager', 'employee', 'marketing', 'marketing_admin',
      'legal', 'legal_admin', 'finance', 'finance_admin', 'viewer', 'agent',
      'broker', 'owner'
    );
  END IF;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS "requestedRole" public."users_requestedRole_enum",
  ADD COLUMN IF NOT EXISTS "nafathVerifiedAt" timestamp,
  ADD COLUMN IF NOT EXISTS "providerProfile" jsonb;

COMMIT;
