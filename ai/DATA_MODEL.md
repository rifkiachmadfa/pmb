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
