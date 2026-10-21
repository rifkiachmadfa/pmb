# Testing Strategy

Status: strategy only; no tests are claimed to have run.

## Baseline checks
- Package install using the repository's chosen package manager and lockfile.
- Lint.
- Type check.
- Unit tests.
- Prisma schema validation and client generation.
- Production build.
- Migration review; do not run destructive operations against shared/production DB.
- End-to-end tests once the flow exists.

## Authentication
- Unauthenticated user cannot access registration/dashboard.
- Sign-up, sign-in, sign-out, recovery, and session expiry behave as designed.
- User A cannot read/update User B's registration by changing IDs.
- Unauthorized user cannot update admission status.

## Registration
- Terms step blocks progression until acceptance.
- Values persist while moving between steps.
- Required fields and conditional KPS/KIP rules validate.
- Invalid server payloads are rejected.
- Duplicate/repeated submit does not create unintended duplicate registration.
- Sensitive data is not written to application logs.

## Payment
- Fixed amount is created server-side.
- Pending does not become paid.
- Verified success updates the correct payment only.
- Wrong amount, invalid signature, unknown transaction, duplicate callback, and out-of-order callback are handled safely.
- Browser redirect without verified notification does not mark paid.
- Payment status and admission status remain independent.

## Notifications
- Registration-created notification is queued/sent after successful persistence.
- Payment-confirmed notification only follows verified successful payment.
- Repeated events do not create duplicate notification side effects.
- Provider failure is recorded and retryable without invalidating registration/payment.

## Reporting
Record exact commands, exit status, and relevant output summary. If a command cannot run because environment/dependency/credentials are unavailable, report NOT RUN and why. Never fabricate passing results.
