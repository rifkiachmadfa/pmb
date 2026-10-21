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

## Phase 2 — UI shell, authentication, wizard skeleton
- Build responsive Indonesian UI.
- Implement sign-up/sign-in, logout, and secure recovery based on the approved auth design.
- Protect registration/dashboard routes.
- Implement five-step navigation, back/next, progress indicator, and draft-in-memory/state persistence as appropriate.
Acceptance: unauthenticated visitors cannot access private registration; form values survive step navigation; terms step blocks next until agreement.

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
