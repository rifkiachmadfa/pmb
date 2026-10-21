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

## ADR-014 — Exact stack versions
Status: APPROVED BY OWNER INSTRUCTION (Phase 1 executed directly); versions chosen from the npm registry on 2026-10-21.
Next 16.4.2, React 19.3.0, TypeScript 5.9.3, Tailwind 4, ESLint 9, Zod 4.6.7, Prisma 7.10.1 (+ client and adapter-pg at the same version), npm. Rationale: Next 16 requires Node >=20.9; Prisma 7.10.1 requires Node ^22.12; sandbox is Node 22.22.
Deliberately NOT adopted: `prisma@latest` tag (8.0.0-rc.24, a release candidate); TypeScript 7 (npm `latest`; unverified with Next/ESLint tooling); ESLint 10.

## ADR-015 — Prisma 7 access pattern
Status: PROPOSED (implemented as baseline)
Prisma 7 `prisma-client` generator output to `src/generated/prisma` (gitignored, regenerated on install), driver adapter `@prisma/adapter-pg` mandatory, datasource URL in `prisma.config.ts`. Runtime uses pooled `DATABASE_URL`; Migrate uses `DIRECT_URL`. Host/port/pooler mode must be confirmed against the actual Supabase project. No domain models until business decisions are approved.

## ADR-016 — Next.js defaults changed from scaffold
Status: APPROVED (engineering decision)
Removed scaffold's `cacheComponents` and `partialPrefetching` (alter dynamic-rendering semantics; risky for private per-user data, not requested). Replaced Google-font imports with a system font stack so builds need no external network. Replaced the generated global `LayoutProps` type with an explicit prop type so `tsc` passes on a clean checkout. Added `poweredByHeader: false`.

## ADR-017 — shadcn/ui foundation set up manually
Status: PROPOSED
`shadcn init` could not reach its registry from the sandbox, so `components.json`, `cn()` and theme tokens were written by hand following the standard new-york/neutral layout. Components are added in Phase 2 via the CLI. UPDATE (P2-1): the CLI was still unreachable, so the five base components were hand-written in the shadcn new-york style; see ADR-019.

## ADR-018 — Prisma domain schema v1
Status: PROPOSED (owner requested the schema ahead of Phase 2; not a phase approval)
Adds Account, Registration, StudentData, ParentGuardian, PreviousSchool, Payment, PaymentEvent, NotificationDelivery, AdmissionDecision. Highlights: provider-agnostic Account; separate registration/payment/admission states; idempotency via unique `eventKey`/`dedupeKey`; Restrict-only deletes; unconfirmed option lists as String; one registration per account per period (answers an OPEN question provisionally). Details and open items: `DATA_MODEL.md`. Parent/guardian and previous-school tables remain PROPOSED per ADR-007/008.

## ADR-019 — Design tokens and base UI components (P2-1)
Status: PROPOSED (implemented; palette itself is APPROVED by owner in PHASES.md)
- Raw hex values live ONLY in `:root` of `src/app/globals.css`; components use semantic Tailwind utilities (`bg-primary`, `text-foreground`, `border-input`, ...). Brand tokens: `--brand-blue|cream|yellow|navy`.
- Primary = light blue with NAVY label (white fails: 1.55:1). Hover/active are navy mixed into the blue (`#9cc5e4`, `#91b8d6`), still 6.76:1 / 5.88:1.
- Focus ring = navy (light blue ring is only 1.53:1 on the page background). Form control border `--input` `#8C8577` (3.60:1); `--border` is decorative only.
- Yellow is used only as `--highlight` and the warning alert; never as page background.
- Light mode only. No dark palette approved, so the scaffold `.dark` block was removed (the `dark` custom variant remains inert).
- Derived tints (`--info`, `--warning`, `--destructive*`, `--muted-foreground`, `--secondary`) are NOT in the approved palette; they are engineering choices for feedback/neutral surfaces. Owner may adjust. Red `#B3261E` is used only for errors.
- No new dependencies: Checkbox is a styled native `<input type="checkbox">`; Button exports `buttonVariants` for use on `next/link` instead of Radix `Slot`/`asChild`. Revisit if a component needs real Radix behavior (Select, Dialog, ...).
- Layout: root layout owns the shell; pages must not render their own `<main>`.

