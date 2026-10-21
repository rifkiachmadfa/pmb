# Phase Specifications

Each phase must have a task plan, file scope, acceptance criteria, tests, risks, and handoff. Do not claim completion without evidence.

## Phase 0 — Audit and project baseline
Tasks:
- Inspect actual repository, Git status, recent commits, branch, and existing diffs.
- Inspect Node.js/package manager, dependency versions, existing source, Prisma files, tests, and environment handling.
- Confirm repository URL and whether sandbox is connected to it.
- Establish exact compatible stack versions without unnecessary upgrades.
- Decide and document auth architecture; Supabase Auth is a candidate, not an assumed existing implementation.
- Finalize initial architecture, state model, security assumptions, and unresolved business questions.
- Create/update all initial `.ai/` documents and `.env.example` if appropriate.
Acceptance:
- Repository facts are verified and documented.
- Proposed stack/auth decisions and rationale are documented.
- Business rules and unresolved decisions are separated.
- No secrets are added.
- Current state, roadmap, changelog, and handoff match the evidence.
- A precise Phase 1 task is ready.
Tests: documentation review and any available baseline commands; do not invent results.
Out of scope: implementing the five-step form, payment, or Fonnte integration.

## Phase 1 — Application foundation
- Create/verify Next.js App Router + TypeScript strict foundation.
- Configure Tailwind and shadcn/ui according to the selected compatible versions.
- Configure Supabase PostgreSQL connection and Prisma.
- Add safe environment validation and `.env.example`.
Acceptance: reproducible install, dev server, lint/type-check/build where configured, Prisma schema validation/generation where possible; no real secrets committed.

# PHASE 2 — DESIGN SYSTEM & UI IMPLEMENTATION RULES

## Visual Direction

Build a modern, polished, trustworthy school admission portal for PMB SMK Yadika Tanjungsari Sumedang.

The interface must feel intentionally designed by a professional product designer. Avoid generic AI-generated SaaS aesthetics.

### Color tokens

- Primary light blue: `#A9D5F5`
- Warm white background: `#FFFDF7`
- Soft yellow accent: `#F3C969`
- Dark navy text: `#25364A`
- Supporting neutral borders: warm gray
- White surfaces may be used sparingly for contrast.

Define reusable semantic design tokens in the project's global styling. Do not scatter arbitrary hex values across components.

### Color discipline

- Warm white is the dominant page background.
- Light blue is the primary brand and interaction color.
- Yellow is a minor accent, never a dominant background.
- Navy provides readable text and visual hierarchy.
- Use neutral surfaces and subtle borders to organize information.
- Ensure accessible contrast, especially for text and button labels. Do not use pale blue or yellow as low-contrast text colors.

### Visual principles

1. Prefer clean typography, consistent spacing, strong alignment, and clear hierarchy.
2. Use a restrained radius scale and subtle borders.
3. Use shadows only when they improve hierarchy.
4. Avoid excessive gradients, glassmorphism, neon colors, floating decorative blobs, oversized rounded cards, and unnecessary animations.
5. Do not make every section a separate card.
6. Avoid excessive icons, emojis, badges, and decorative illustrations.
7. Do not use random colors for different form steps.
8. Do not invent statistics, testimonials, awards, or school claims.
9. Keep the interface responsive, accessible, and comfortable for long forms.
10. Prioritize clarity and usability over visual novelty.

## Component and Library Policy

Before implementing UI:
- Inspect the existing package manifest, lockfile, installed components, and current project conventions.
- Reuse existing shadcn/ui components and design tokens whenever possible.
- Use maintained, compatible versions of Next.js, Tailwind CSS, shadcn/ui, and Lucide icons appropriate to the repository.
- Consult current official documentation when API compatibility is uncertain.
- Do not replace working dependencies or upgrade packages solely to appear modern.
- Add a dependency only when it solves a concrete requirement.
- Prefer CSS transitions and existing primitives over adding an animation library without a clear need.
- Keep components reusable, typed, and organized by responsibility.

## Phase 2 Scope

Implement:
- Shared responsive application shell.
- Sign-up and sign-in interfaces.
- Secure account recovery interface.
- Protected registration and dashboard routes.
- Five-step registration wizard skeleton.
- Progress indicator and back/next navigation.
- Terms acceptance gate.
- Form draft state that survives step navigation.
- Consistent loading, validation, empty, and error states.

Follow the authentication architecture approved in Phase 0. Do not implement custom password storage or bypass server-side authorization.

The five steps must be visually consistent:
1. Ketentuan
2. Data Siswa
3. Data Orang Tua / Wali
4. Data Sekolah Asal
5. Konfirmasi

## Acceptance Criteria

- The UI uses the approved color tokens consistently.
- The interface looks cohesive on mobile and desktop.
- The form remains readable and easy to navigate.
- Yellow remains a restrained accent.
- No generic AI-style decorative elements are added without a specific design purpose.
- Unauthenticated visitors cannot access private registration or dashboard data.
- Form values survive navigation between steps.
- The user cannot proceed past terms without explicit agreement.
- Relevant lint, type-check, and build checks are executed when available.
- Update `.ai/ARCHITECTURE.md`, `.ai/CURRENT_STATE.md`, `.ai/ROADMAP.md`, `.ai/CHANGELOG.md`, and the task handoff based on verified results.

Do not claim that Phase 2 is complete until its acceptance criteria have been verified.

## Phase 3 — Student data
- Implement official student fields from requirements.
- Use string types for identity numbers, phone numbers, and postal code.
- Implement client usability validation and server Zod validation.
- Treat KPS/KIP no-number convention according to approved rules.
Acceptance: required fields, error states, conditional fields, and server validation work; no sensitive payloads in logs.

## Phase 4 — Parent/guardian and previous school
- Start from draft fields in DATA_MODEL.md and BUSINESS_RULES.md.
- Do not treat draft fields as official until reviewed by school/owner.
- Implement approved fields and conditional rules.
Acceptance: field list and required policy have explicit approval; schema and UI agree.

## Phase 5 — Confirmation and registration persistence
- Review summary with edit navigation.
- Persist registration linked to authenticated account.
- Use transaction/constraints to prevent duplicate or orphan records.
- Trigger durable notification work for registration-created event.
Acceptance: reload does not lose persisted registration; user can access only their own record; repeat submissions are handled safely.

## Phase 6 — Midtrans
- Create transaction server-side for the fixed IDR 350,000 initial payment.
- Persist transaction reference and payment attempt.
- Verify provider notifications server-side, expected amount and transaction identity.
- Handle duplicate/out-of-order notifications and allowed state transitions.
Acceptance: sandbox tests cover success, pending, failure/expiry, invalid notification, wrong amount, repeated callback, and browser-return without webhook.

## Phase 7 — Fonnte
- Send notification after registration creation and after verified successful payment.
- Store notification state, attempts, and safe error metadata.
- Implement retries without duplicate side effects.
Acceptance: both events work in provider sandbox/test setup where available; failures do not reverse registration/payment; no tokens exposed.

## Phase 8 — Dashboard and admission decision
- Show account status, registration progress/submission, payment status, and admission status independently.
- Implement admin decision workflow only after role/authorization policy is approved.
- Restrict all records by authenticated ownership/authorized role.
Acceptance: students see their own statuses only; payment does not change admission status automatically; unauthorized users cannot change admission decisions.

## Phase 9 — QA and security
- Run lint, type-check, unit/integration/e2e tests and production build where available.
- Test access control, validation, retry/idempotency, provider failures, responsive UI, and accessibility.
- Inspect dependencies and secrets.
Acceptance: failures are fixed or documented as blockers; no false claims of test coverage.

## Phase 10 — Deployment and handoff
- Configure production environment and domain.
- Configure provider production credentials/webhook URLs safely.
- Apply migrations using reviewed, non-destructive production procedure.
- Document backup, monitoring, reconciliation, and support procedures.
Acceptance: production smoke tests and payment/notification verification are evidenced; operational handoff is complete.
