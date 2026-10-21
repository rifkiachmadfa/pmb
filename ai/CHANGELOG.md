# Project Changelog

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
