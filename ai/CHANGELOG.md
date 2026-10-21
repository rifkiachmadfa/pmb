# Project Changelog

## P6-2 + P6-3 — Pembayaran awal: buat transaksi, verifikasi notifikasi, sinkronisasi status (2026-10-22) — IMPLEMENTED; TESTED on local PostgreSQL 16 with stubbed Midtrans (171 checks + 3 mutation checks); real Midtrans sandbox and signed-in server actions UNTESTED
- New: `src/server/payments/{status,lock,create,notification}.ts`, `src/app/api/payments/midtrans/notification/route.ts`, `src/features/payment/actions.ts` (`startInitialPayment`, `getPaymentStatus`, `refreshPaymentStatus`). Modified: `src/config/payment.ts` (expiry 24 h, stale 60 s), `midtrans-env.ts` (status API host), `midtrans.ts` (`expiry` in the request, `getTransactionStatus`).
- Behavior: one unpaid attempt reused; no attempt after PAID; webhook verifies signature, order identity, stored amount, currency and allowed transition; duplicates/out-of-order never downgrade or re-notify; PAID queues one `PAYMENT_VERIFIED` outbox row; admission status untouched. No schema change, no migration, no dependency.
- Decision: ADR-026 (PROPOSED). Known gap: no rate limit on `refreshPaymentStatus`.

## P6-1 — Setup awal Midtrans (2026-10-22) — IMPLEMENTED; TESTED with stubbed fetch (32 checks); real Midtrans sandbox UNTESTED
- New: `src/config/payment.ts` (fixed IDR 350,000 + item label), `src/server/payments/midtrans-env.ts` (lazy env validation, sandbox/production URLs, key/env mismatch guard), `src/server/payments/midtrans.ts` (`createSnapTransaction`, `generateMidtransOrderId`, `MidtransRequestError`). `.env.example` documents the three variables.
- Deliberately NOT done: Payment persistence, webhook/verification, UI, dashboard status, any DB migration. No dependency added. ADR-025 (PROPOSED).

## P5-1 — Konfirmasi + penyimpanan pendaftaran (2026-10-22) — IMPLEMENTED; persistence TESTED on local PostgreSQL 16 (32 checks); signed-in end-to-end and browser interaction UNTESTED
- Step 5 shows the full read-only summary with an Ubah button per section, a confirmation checkbox and "Kirim Pendaftaran". New server action `submitRegistration` re-validates the whole payload with the shared Zod schemas, takes the owner from the verified session only, and writes Registration (SUBMITTED), StudentData, ParentGuardian rows, PreviousSchool and one `NotificationDelivery` (REGISTRATION_CREATED, PENDING) in ONE transaction. Repeat/parallel submits return the existing registration (unique `ownerId + admissionPeriod`).
- Migration `20261022100000_registration_persistence` (additive, nullable): `registrations.chosen_major`, `parent_guardians.birth_year`. `src/config/admission.ts` holds `ADMISSION_PERIOD` and `TERMS_VERSION`.
- `/pendaftaran` redirects to `/dashboard` when the account already submitted; the dashboard shows the account's own registration (number, name, major, time). Payment/admission statuses still absent (Phases 6/8). No sending of WhatsApp yet (Phase 7): only the outbox row is created.
- Decision: ADR-024 (registration number format, one-shot submit, in-memory draft) — PROPOSED.

## P4-2 — Data Sekolah Asal + Jurusan (2026-10-22) — IMPLEMENTED, PARTLY TESTED in sandbox (typecheck/lint/build + 26 schema checks + SSR HTML check; browser interaction UNTESTED)
- Step 4 now has the owner's 5 fields (asal sekolah, status, alamat, tahun lulus, jurusan). New `school-schema.ts` (shared Zod), server action `validateSchoolStep`, UI `step-school.tsx`. Draft/reducer/wizard/review typed and gated (leaving step 4 needs a valid draft).
- Removed unused `step-placeholder.tsx` and `DraftSection`. Decisions/assumptions: ADR-023 (PROPOSED). No Prisma change (Jurusan has no column; recorded for Phase 5). Phase 4 field work complete; all five wizard steps now have content.

## P4-1 — Data Orang Tua / Wali (2026-10-22) — IMPLEMENTED, PARTLY TESTED in sandbox (typecheck/lint/build + 38 schema checks + SSR HTML check; browser interaction UNTESTED)
- Step 3 now has the owner's 21 fields (Ayah, Ibu, Wali x NIK, nama, tahun lahir, pendidikan, pekerjaan, penghasilan, HP). New `guardian-schema.ts` (shared Zod), server action `validateParentsStep`, UI `step-parents.tsx` (button "Tidak ada wali" fills all Wali fields with "-").
- Draft/reducer/wizard/review: typed parents draft, gate on leaving step 3 (Lanjut, stepper, goTo), review shows completeness. `student-schema.ts` only exports 4 existing helpers (no behavior change).
- Step 4 (Data Sekolah Asal) stays a placeholder: its field list has not been provided.
- Decisions/assumptions: ADR-022 (PROPOSED). No Prisma schema/migration change (birthYear vs birthDate mismatch recorded for Phase 5).

## P3-1 — Data Siswa fields and validation (2026-10-22) — IMPLEMENTED, TESTED in sandbox (typecheck/lint/build + schema checks + Playwright)
- Step 2 now has the full owner-supplied field list in six sections (identity, address, KPS/KIP, family/physical, residence/transport, contact). New `ui/field`, `ui/select`, `ui/radio` primitives.
- `student-schema.ts`: shared Zod validation + normalization (strings for NISN/NIK/KK/akta/phones/postal code, `-` convention, real-date check). `actions.ts`: server action `validateStudentStep` (session check + Zod, no storage, no logging).
- Wizard: errors on blur and after Lanjut, error summary, focus first invalid field, server check before advancing, "session ended" notice that keeps the draft, no jumping past an invalid Data Siswa. Review step shows student completeness.
- Decisions/assumptions: ADR-021 (PROPOSED). No schema/migration change.

## P2-4 — Phase 2 closing (2026-10-22) — IMPLEMENTED, TESTED in sandbox (typecheck/lint/build + curl checks)
- Added `src/app/loading.tsx`, `error.tsx` (generic message, error object never rendered), `not-found.tsx`.
- `/masuk`: added account-recovery hint (recovery is handled by Google; link to Google support). No password UI exists by design (ADR-020).
- `ensureAccount()` now reads first and writes only when the row is new or the email changed (private pages call it on every request).
- `/auth/callback`: failure of `ensureAccount` now logs a redacted summary (error name, code, first message line, top stack frames); emails and DB URLs are redacted.
- Diagnosed `?error=account` as a stale local Prisma client (`getDb().account` undefined); fix is `npx prisma generate` and clearing `.next`.
- Docs: CURRENT_STATE.md, ROADMAP.md, handoff/P2-4.md.

## P2-2 — Five-step wizard skeleton (2026-10-22) — IMPLEMENTED, TESTED (typecheck/lint/build + local Playwright check)
- Added `/pendaftaran` with a client-side wizard: Ketentuan, Data Siswa, Data Orang Tua / Wali, Data Sekolah Asal, Konfirmasi.
- Stepper (compact bar on mobile, ordered list from `md`; only reached steps are clickable), Kembali/Lanjut navigation, focus moves to the step heading on change.
- Terms gate: five official terms (verbatim from BUSINESS_RULES.md) and an explicit checkbox; Lanjut shows an error and does not advance until accepted; withdrawing consent returns to step 1.
- Local draft state (`useReducer`, in memory only) survives step navigation. Steps 2-4 are honest placeholders (no invented fields; Phase 3/4). Step 5 is a review/edit summary with a notice that submission is not available yet.
- No new dependencies. No auth, database, payment, or notification code.
- Docs: ARCHITECTURE.md, CURRENT_STATE.md, ROADMAP.md, handoff/P2-2.md.

## P2-1 — Design tokens and app shell (2026-10-21) — IMPLEMENTED, TESTED (build/lint/typecheck + local browser check)
- Replaced neutral shadcn tokens in `src/app/globals.css` with the approved palette (light blue `#A9D5F5`, warm white `#FFFDF7`, soft yellow `#F3C969`, navy `#25364A`) mapped to semantic tokens. Light mode only (the unapproved `.dark` palette was removed).
- Added UI components (no new dependencies): `button`, `input`, `label`, `checkbox`, `alert` in `src/components/ui/`.
- Added shared shell: `SkipLink`, `SiteHeader`, `SiteFooter`, `PageContainer` in `src/components/layout/`; root layout now renders header + `<main id="main">` + footer.
- Primary buttons use navy labels on light blue (white on light blue is 1.55:1, fails WCAG).
- Updated placeholder home page to use the shell.
- Not in scope / not done: auth screens, protected routes, wizard skeleton (later Phase 2 tasks).
- Docs: ARCHITECTURE.md (UI section), DECISIONS.md (ADR-017 note, ADR-019), CURRENT_STATE.md, ROADMAP.md, handoff/P2-1.md.

## P2-3 — Google-only authentication (2026-10-22) — IMPLEMENTED, PARTIALLY TESTED
- Added Supabase Auth (Google only) with `@supabase/ssr`, `src/proxy.ts`, `/masuk`, `/auth/callback`, sign-out, `/dashboard` placeholder, header account actions, and `requireAccount()` on `/pendaftaran` and `/dashboard`. `Account` is upserted on every login.
- Added env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`.env.example`). ADR-012 approved, ADR-020 added.
- Verified: typecheck, lint, build, route-redirect checks with placeholder env, ad-hoc test of `sanitizeNextPath`. NOT verified: real Google login, Account upsert against a database, session refresh. See `ai/handoff/P2-3.md`.

## DB-SCHEMA-001 — Prisma domain schema v1 (2026-10-21) — IMPLEMENTED, UNMIGRATED, PROPOSED
- Replaced baseline `prisma/schema.prisma` with domain models (accounts, registrations, student data, parent/guardian, previous school, payments, payment events, notification deliveries, admission decisions).
- Verified: `prisma format`, `prisma validate`, `prisma generate`, `npm run typecheck`, `npm run lint` (sandbox needs `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true`). Not run: migrations, DB connection.
- Docs: DATA_MODEL.md (schema notes, manual SQL, open items), ADR-018, CURRENT_STATE.md.

## Phase 1 — Application foundation (2026-10-21) — VERIFICATION_REQUIRED
- Added Next.js 16.4.2 App Router + TypeScript strict + Tailwind 4 + ESLint foundation (Indonesian placeholder page, `/api/health`).
- Added Prisma 7.10.1 baseline (no models), `prisma.config.ts`, `src/server/db.ts`, lazy Zod env validation `src/server/env.ts`, `.env.example`.
- Added shadcn/ui foundation (manual): `components.json`, `cn()`, theme tokens. No components yet.
- Extended `.gitignore`; added npm scripts `typecheck`, `db:validate`, `db:generate`, `postinstall`.
- Evidence and limits: see CURRENT_STATE.md Verification. DB connection and migrations NOT verified.

## Initial documentation baseline
Status: DOCUMENTATION PREPARED; repository implementation not yet audited.

- Recorded PMB 2026/2027 product context.
- Recorded five-step registration flow.
- Recorded mandatory account before registration and student dashboard requirement.
- Recorded initial payment IDR 350,000 allocated toward admission fee.
- Recorded Midtrans Snap and Fonnte integration requirements.
- Recorded two notification events: registration created and verified payment.
- Added draft parent/guardian and previous-school fields pending school review.
- Added initial roadmap, architecture proposal, data model, security and testing strategy.

No application code, provider integration, test, or deployment is claimed by this changelog.
