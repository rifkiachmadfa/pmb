# Architecture and Business Decisions

Status labels: APPROVED, PROPOSED, REJECTED, SUPERSEDED.

## ADR-001 — Application framework
Status: APPROVED AS REQUIREMENT
Use Next.js App Router and TypeScript. Exact compatible versions to be selected after repository audit.

## ADR-002 — Database and ORM
Status: APPROVED AS REQUIREMENT
Use Supabase PostgreSQL as the primary database and Prisma ORM for application data access, subject to compatibility verification in Phase 0.

## ADR-003 — Five-step registration
Status: APPROVED
1. Ketentuan
2. Data Siswa
3. Data Orang Tua / Wali
4. Data Sekolah Asal
5. Konfirmasi

## ADR-004 — Initial payment
Status: APPROVED
Initial payment is IDR 350,000 and is allocated toward the school admission fee, not charged as an additional fee.

## ADR-005 — Server-verified payment
Status: APPROVED
Payment success is established by server-side provider notification verification, never by browser redirect alone.

## ADR-006 — Fonnte notifications
Status: APPROVED
Send after registration creation and after server-verified successful payment. Delivery failures must not invalidate registration or payment.

## ADR-007 — Parent/guardian form
Status: PROPOSED — AWAITING SCHOOL REVIEW
Draft relationship, identity, education, occupation, income, contact, and address fields. Requiredness and options are not final.

## ADR-008 — Previous-school form
Status: PROPOSED — AWAITING SCHOOL REVIEW
Draft school level, name, NPSN, status if needed, address, entry/graduation years, and optional exam/diploma fields. Requiredness and options are not final.

## ADR-009 — Two-stage WhatsApp notifications
Status: APPROVED
Two distinct notification events: registration created; payment verified successful.

## ADR-010 — Mandatory student accounts and dashboard
Status: APPROVED
Every prospective student must create an account or sign in before accessing registration. Account records persist whether or not the student pays. Registration is linked to the authenticated owner. Dashboard shows registration, payment, and admission statuses separately. Secure recovery is required; raw passwords must never be stored.

## ADR-011 — Independent payment and admission statuses
Status: APPROVED
Successful payment does not automatically mean admitted. Admission decision is controlled by authorized school personnel and requires an approved admin workflow.

## ADR-012 — Authentication provider
Status: PROPOSED
Supabase Auth is a candidate. Confirm the implementation and its relationship to Prisma/PostgreSQL after inspecting the repository and current official documentation.

## ADR-013 — Secure interpretation of the supplied terms
Status: PROPOSED — OWNER/SCHOOL REVIEW
The supplied terms mention that a registrant receives a password. The system should use secure account creation and recovery rather than sending plaintext passwords by email/WhatsApp. Approve revised wording before launch.
