# Project Changelog

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
