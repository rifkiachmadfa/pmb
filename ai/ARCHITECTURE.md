# Architecture (Initial Proposal)

Status: initial proposal; confirm during Phase 0 after repository audit.

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
