# External Integrations

## Supabase PostgreSQL / Auth
Status: NOT CONFIGURED.
- PostgreSQL is the planned primary database.
- Prisma is the planned application ORM.
- Supabase Auth is a candidate authentication provider; finalize during Phase 0.
- Never expose service-role keys in client code.
- Review RLS and server access patterns before enabling policies.
- Never store raw passwords in application tables.

## Midtrans Snap
Status: NOT CONFIGURED.
- Initial amount: IDR 350,000, created server-side.
- Keep server key server-only.
- Persist transaction reference and expected amount.
- Verify notifications using official provider guidance and the configured environment.
- Verify transaction identity, amount, signature/authenticity, and permitted state transition.
- Browser redirect is not proof of payment.
- Process callbacks idempotently and account for duplicate/out-of-order notifications.
- Sandbox test cases: pending, success, failure/expiry, invalid signature, wrong amount, repeated callback, unknown transaction, browser return without verified callback.
- Production credentials and webhook URL must be configured only during deployment.

Official docs: https://docs.midtrans.com/

## Fonnte
Status: NOT CONFIGURED.
Required events:
1. Registration created.
2. Initial payment verified successful.

Requirements:
- Server-only API token.
- Validate destination number and use approved message templates.
- Track pending/sent/failed/retry state and safe error details.
- Prevent duplicate sends from repeated events/retries.
- A notification failure must not change registration/payment status.
- Do not include unnecessary sensitive personal information in messages.
- Verify behavior with the actual account and current provider documentation.

Docs: https://docs.fonnte.com/

## Provider availability
Do not claim integration is tested unless actual provider test results exist. If sandbox credentials or network are unavailable, document code-level checks separately from provider verification.
