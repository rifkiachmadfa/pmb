# Roadmap

Statuses: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `VERIFICATION_REQUIRED`.

| Phase | Scope | Initial status |
|---|---|---|
| 0 | Repository audit, requirements baseline, `.ai/` docs, stack/auth decisions, environment safety | IN_PROGRESS (partial: audit + versions done; auth approval, `ai/` vs `.ai/`, business decisions open) |
| 1 | Next.js foundation, TypeScript, UI setup, Supabase/Postgres and Prisma baseline | VERIFICATION_REQUIRED (code done; DB connection + shadcn CLI unverified) |
| 2 | Responsive shell, auth screens, five-step registration wizard skeleton | NOT_STARTED |
| 3 | Student data fields and validation | NOT_STARTED |
| 4 | Parent/guardian and previous-school forms after review | NOT_STARTED |
| 5 | Confirmation, registration persistence, ownership and dashboard foundation | NOT_STARTED |
| 6 | Midtrans transaction creation, webhook verification, payment state machine | NOT_STARTED |
| 7 | Fonnte notifications at registration and verified-payment events | NOT_STARTED |
| 8 | Student dashboard and status presentation; admin admission-status workflow as approved | NOT_STARTED |
| 9 | Security review, accessibility, end-to-end and failure-path QA | NOT_STARTED |
| 10 | Deployment, production configuration, operational handoff | NOT_STARTED |

## Phase completion policy
A phase is COMPLETED only when its acceptance criteria are satisfied, relevant checks are executed, actual evidence is recorded, and documentation is updated. If code exists but required verification is unavailable, use VERIFICATION_REQUIRED. Do not advance past unresolved dependencies without owner approval.

## Current focus
Phase 1 implemented; awaiting owner verification (see CURRENT_STATE.md). Next: Phase 2 once ADR-012 is approved. Do not implement the form, payment, or notification integrations ahead of their phases.
