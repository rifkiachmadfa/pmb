# Roadmap

Statuses: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `VERIFICATION_REQUIRED`.

| Phase | Scope | Initial status |
|---|---|---|
| 0 | Repository audit, requirements baseline, `.ai/` docs, stack/auth decisions, environment safety | IN_PROGRESS (partial: audit + versions done; auth approval, `ai/` vs `.ai/`, business decisions open) |
| 1 | Next.js foundation, TypeScript, UI setup, Supabase/Postgres and Prisma baseline | VERIFICATION_REQUIRED (code done; DB connection + shadcn CLI unverified) |
| 2 | Responsive shell, auth screens, five-step registration wizard skeleton | READY TO CLOSE (P2-1..P2-4 IMPLEMENTED; sandbox checks pass; waiting for owner to confirm signed-in login end-to-end and visual review) |
| 3 | Student data fields and validation | VERIFICATION_REQUIRED (P3-1 IMPLEMENTED/TESTED in sandbox; signed-in server round trip untested; assumptions in ADR-021 need school approval) |
| 4 | Parent/guardian and previous school | VERIFICATION_REQUIRED (P4-1, P4-2 IMPLEMENTED, partly tested; browser interaction and school approval of ADR-022/023 pending) |
| 5 | Confirmation and registration persistence | VERIFICATION_REQUIRED (P5-1 IMPLEMENTED; persistence TESTED against a local PostgreSQL 16, not the Supabase project; signed-in end-to-end, browser interaction, and owner migration pending) |
| 6 | Midtrans transaction creation, webhook verification, payment state machine | NOT_STARTED |
| 7 | Fonnte notifications at registration and verified-payment events | NOT_STARTED |
| 8 | Student dashboard and status presentation; admin admission-status workflow as approved | NOT_STARTED |
| 9 | Security review, accessibility, end-to-end and failure-path QA | NOT_STARTED |
| 10 | Deployment, production configuration, operational handoff | NOT_STARTED |

## Phase completion policy
A phase is COMPLETED only when its acceptance criteria are satisfied, relevant checks are executed, actual evidence is recorded, and documentation is updated. If code exists but required verification is unavailable, use VERIFICATION_REQUIRED. Do not advance past unresolved dependencies without owner approval.

## Current focus
P3-1 (Data Siswa fields + shared Zod validation + server action `validateStudentStep`) IMPLEMENTED/TESTED in sandbox, awaiting owner review/commit and school confirmation of ADR-021. P4-1 (Data Orang Tua / Wali, ADR-022) IMPLEMENTED, awaiting owner review/commit. P4-2 (Data Sekolah Asal + Jurusan, ADR-023) IMPLEMENTED. P5-1 (confirmation review + registration persistence, ADR-024) IMPLEMENTED; owner must review/commit it and apply migration `20261022100000_registration_persistence` to the Supabase database. Next: Phase 6 (Midtrans) after owner sign-off on Phase 5.

P2-1 (design tokens, base components, shared layout) IMPLEMENTED/TESTED, awaiting owner visual review and commit. P2-2 (five-step wizard skeleton at `/pendaftaran`, local draft, terms gate) IMPLEMENTED/TESTED, awaiting owner review and commit. P2-3 (Google-only auth via Supabase, `/masuk`, protected `/pendaftaran` + `/dashboard`) IMPLEMENTED, awaiting owner Supabase/Google setup and end-to-end check. P2-4 (closing: loading/error/not-found states, Google account-recovery hint on `/masuk`, read-before-write `ensureAccount`, safe callback diagnostics) IMPLEMENTED/TESTED in sandbox. Phase 2 is marked DONE only after the owner confirms the signed-in flow (sign in -> `/dashboard` -> `accounts` row -> Keluar) and visual review; until then it is READY TO CLOSE.

DB-SCHEMA-001 (owner-requested Prisma schema v1) done as PROPOSED/unmigrated; awaiting owner review. Phase 3-5 field/persistence work still follows phase order.

Phase 1 implemented; awaiting owner verification (see CURRENT_STATE.md). Do not implement the form, payment, or notification integrations ahead of their phases.
