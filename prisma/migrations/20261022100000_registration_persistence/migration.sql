-- Phase 5 (P5-1): columns required to persist the wizard data (ADR-022, ADR-023).
-- Additive and non-destructive: both columns are nullable, no data is rewritten.

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN "chosen_major" TEXT;

-- AlterTable
ALTER TABLE "parent_guardians" ADD COLUMN "birth_year" SMALLINT;
