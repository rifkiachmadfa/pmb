# Architecture (Initial Proposal)

Status: usulan awal yang sebagian besar sudah diimplementasikan (Phase 0-6 ditutup owner, 22 Okt 2026). Untuk kondisi sebenarnya, kode dan `CURRENT_STATE.md` menang atas dokumen ini.

## Layers
- `src/app/`: App Router pages, layouts, route handlers.
- `src/components/`: shared and feature UI, including registration wizard.
- `src/lib/`: safe shared utilities, schemas, environment validation.
- `src/server/`: server-only business logic and provider clients, if compatible with repository conventions.
- `prisma/`: schema and migrations.
- `tests/`: unit/integration/e2e tests as selected.

## Responsibilities
- UI collects input and presents validation feedback.
- Server validates all inputs and enforces identity, ownership, and business rules.
- Prisma accesses PostgreSQL.
- Authentication provider handles credentials, sessions, and recovery; do not implement password storage manually.
- Midtrans server integration creates transactions and verifies notifications.
- Fonnte server integration sends messages from durable event/notification work.
- Dashboard reads only the current user's permitted records.
- Authorized school staff may update admission decisions through a separately authorized workflow, subject to approval.

## Suggested domain separation
Account/auth identity; StudentProfile; Registration; ParentGuardian; PreviousSchool; Payment; PaymentEvent; NotificationDelivery; AdmissionDecision/AuditEvent.

Names and exact cardinalities are provisional until schema design and school requirements are confirmed.

## Reliability
Use database transactions and unique constraints for critical state changes. Persist payment and notification events before external side effects where appropriate. Use idempotency keys or stable event identifiers. External notification failure must not roll back verified payment.

## UI
The primary public experience is a direct PMB application flow, not a content-heavy marketing landing page. Use Indonesian labels, accessible forms, clear progression, and mobile-first responsive layout.

## UI structure (implemented in P2-1; see ADR-019)
- `src/app/globals.css`: design tokens (approved palette -> semantic tokens), light mode only.
- `src/components/ui/`: `button`, `input`, `label`, `checkbox`, `alert` (hand-written in shadcn new-york style, no Radix).
- `src/components/layout/`: `SkipLink`, `SiteHeader` (has a `children` slot for future nav/account actions), `SiteFooter`, `PageContainer` (`narrow` | `default` | `wide`).
- `src/app/layout.tsx`: skip link, header, `<main id="main">`, footer. Pages render inside `main` and must not add another.

## Registration wizard (implemented in P2-2)
- Route `src/app/pendaftaran/page.tsx` (server component, static) renders the client component `RegistrationWizard`. The route is protected by P2-3 (see Authentication below).
- `src/features/registration/steps.ts`: step ids/labels and the five official terms. `draft.ts`: pure reducer (`wizardReducer`) with `termsAccepted`, `student`, `guardian`, `previousSchool` sections (empty until Phase 3/4). `components/`: `registration-wizard`, `wizard-stepper`, `step-terms`, `step-placeholder`, `step-review`.
- All steps render inside one component, so the draft survives navigation. State is in memory only: reload loses it. No localStorage by design (personal data; persistence policy not approved). Real persistence arrives in Phase 5 with authentication.

## Authentication (implemented in P2-3; see ADR-012, ADR-020)
- Google sign-in only, through Supabase Auth; cookie session via `@supabase/ssr`.
- `src/lib/supabase/config.ts`: validates the two public env vars. `src/server/supabase/server.ts`: per-request server client. `src/server/supabase/refresh-session.ts` + `src/proxy.ts`: session refresh and optimistic redirects.
- `src/server/auth/session.ts` (data-access layer): `getSessionUser()` (verified claims), `ensureAccount()` (Prisma upsert), `requireAccount(nextPath)` (use at the top of every private page/action).
- `src/features/auth/actions.ts`: `signInWithGoogle`, `signOut`. `src/app/auth/callback/route.ts`: code exchange + Account creation. `src/lib/auth/safe-redirect.ts`: `sanitizeNextPath`.
- Pages: `/masuk` (sign-in), `/dashboard` (protected placeholder), `/pendaftaran` (protected). `HeaderAccount` shows Masuk / Dashboard / Keluar.
- Because the header reads the session, all pages render dynamically.