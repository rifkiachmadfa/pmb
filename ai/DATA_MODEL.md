# Data Model — Initial Proposal

Status: conceptual; not a final Prisma schema.

## Candidate entities
- Auth identity: managed by selected auth provider; never store raw passwords.
- StudentProfile: profile associated with an authenticated user, subject to approved identity rules.
- Registration: unique registration reference, owner account, submission state, terms acceptance timestamp/version, created/updated timestamps.
- StudentData: NISN, NIK, birth-certificate number, family-card number, legal name, birth details, gender, address, citizenship, KPS/KIP fields, sibling order/count, height/weight, residence type, distance, transport, phone, email, and other approved student fields.
- ParentGuardian: relationship, name, identity/contact, education, occupation, income and address fields after review.
- PreviousSchool: school level, name, NPSN, status, address, entry/graduation years, and other approved fields.
- Payment: registration relation, amount in integer rupiah, provider, provider transaction reference, status, timestamps, and allocation toward admission fee.
- PaymentEvent: provider event identifier/fingerprint, verified status, safe metadata, received/processed timestamps; no secret payload logging.
- NotificationDelivery: event type, recipient reference, provider, status, attempts, timestamps, safe error details, deduplication key.
- AdmissionDecision: registration relation, decision state, authorized actor, timestamp, and approved audit fields.

## Modeling rules
- IDs such as NIK, NISN, family-card number, birth-certificate number, NPSN, phone, and postal code are strings.
- Do not add uniqueness constraints to NIK/NISN/family-card number without confirming re-registration and data-correction policy.
- Amounts use integer rupiah, never floating-point money.
- Keep registration state, payment state, and admission state separate.
- Account existence must not depend on payment.
- Registration must reference its authenticated owner.
- Every private query must enforce ownership/authorization.
- Use timestamps consistently and document timezone handling.
- Define retention/deletion policy with school approval; do not invent it.
- Avoid storing full webhook payloads unless there is an approved secure need; redact sensitive data.
- Supabase Auth internal tables are managed by Supabase; do not casually duplicate credentials into Prisma models.

## Initial payment
IDR 350,000, allocated toward the school admission fee. Model allocation clearly so it is not represented as an extra fee. Payment status only becomes successful after server verification.

## Open questions
- Can one account create more than one registration?
- Which identity fields are unique and at what scope?
- Are multiple parents/guardians represented as separate rows?
- What is the approved admission decision/audit workflow?
- What payment expiry, cancellation, refund, and reconciliation policies apply?

---

# Prisma Schema v1 (task DB-SCHEMA-001, 2026-10-21) — PROPOSED, UNMIGRATED

Source of truth: `prisma/schema.prisma`. Status: IMPLEMENTED; `prisma format/validate/generate` + `tsc` PASS. **No migration created, no database touched.**

## Models
`Account` 1—N `Registration` (unique per `ownerId + admissionPeriod`, PROPOSED). `Registration` 1—1 `StudentData`, 1—N `ParentGuardian` (unique per relationship, PROPOSED), 1—1 `PreviousSchool`, 1—N `Payment`, 1—N `NotificationDelivery`, 1—N `AdmissionDecision`. `Payment` 1—N `PaymentEvent`.

## Design decisions
- **Three independent statuses**: `Registration.status` (DRAFT/SUBMITTED), `Payment.status`, `Registration.admissionStatus` (PENDING/ACCEPTED/REJECTED). Nothing links payment to admission.
- `Account` holds `authProviderId` (string) and no credentials, so it works with Supabase Auth or any other approved provider (ADR-012 still PROPOSED).
- Draft support: `lastCompletedStep` + per-step tables created only after server validation, so required columns stay NOT NULL.
- Option-list fields are `String` (lists unconfirmed). No unique on NIK/NISN/KK (policy unknown); only non-unique indexes on `nik`, `nisn`.
- `PaymentEvent.eventKey` UNIQUE = idempotent callbacks. `NotificationDelivery.dedupeKey` UNIQUE = one notification per event. Raw provider payloads are not stored.
- All FKs `onDelete: Restrict` until a retention policy is approved.

## Required SQL NOT expressible in Prisma (add by hand to the first migration, after review)
```sql
-- At most one PAID payment per registration
CREATE UNIQUE INDEX payments_one_paid_per_registration ON payments (registration_id) WHERE status = 'PAID';
ALTER TABLE payments      ADD CONSTRAINT payments_amount_positive CHECK (amount_idr > 0);
ALTER TABLE registrations ADD CONSTRAINT registrations_step_range CHECK (last_completed_step BETWEEN 0 AND 5);
ALTER TABLE registrations ADD CONSTRAINT registrations_submitted_complete CHECK
  (status <> 'SUBMITTED' OR (submitted_at IS NOT NULL AND terms_accepted_at IS NOT NULL AND registration_number IS NOT NULL));
-- Supabase exposes `public` through its Data API. Deny-by-default for every table (no policies);
-- the app reaches data only through Prisma on the server. REPEAT for all 10 tables.
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY; -- ...and the other tables
```
RLS caveat: confirm the role used in `DATABASE_URL` bypasses RLS (e.g. `postgres`/table owner) on the real project; otherwise Prisma queries will return nothing. UNVERIFIED.

## OPEN items that change this schema
1. One vs. multiple registrations per account/period (currently one).
2. Official option lists, KPS/KIP "-" convention, distance unit (km assumed), weight/height precision.
3. Final parent/guardian + previous-school fields and requiredness.
4. Admission outcomes, staff roles, audit fields.
5. Payment expiry/cancel/refund (no REFUNDED status yet); Snap token storage acceptable?
6. WhatsApp recipient: student or parent; registration-number format.
7. Encryption-at-rest / retention for identity numbers.
