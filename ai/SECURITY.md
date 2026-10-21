# Security Requirements

## Sensitive data
The application handles student identifiers, family details, birth data, contact information, and financial status. Minimize collection, restrict access, and avoid sensitive logging.

## Authentication and authorization
- Require authentication before registration and dashboard access.
- Use provider-managed secure sessions and recovery.
- Never store raw passwords.
- Verify ownership on every read/write, server action, and route handler.
- Do not rely on unguessable IDs as the sole authorization control.
- Admin actions require explicit role-based authorization and auditability.
- Admission status cannot be changed by student clients.

## Input validation
- Validate payloads on the server using explicit schemas.
- Use client validation for usability only.
- Normalize and validate email/phone where appropriate.
- Store identifier-like values as strings.
- Prevent mass assignment by allowlisting accepted fields.
- Do not trust hidden fields or client-submitted status/amount values.

## Payment security
- Create payment transactions server-side.
- Keep provider server keys private.
- Verify callback authenticity and expected transaction/amount.
- Use idempotent processing and allowed status transitions.
- Never mark paid from browser return alone.
- Keep notification failures separate from payment status.

## Secrets and logging
- Keep `.env` out of Git.
- Maintain `.env.example` with variable names and placeholders only.
- Never put secrets in client-prefixed variables.
- Redact identifiers, phone numbers, tokens, and provider payloads in logs.
- Review diffs for accidental secrets before export/commit.

## Database
- Avoid destructive schema operations on shared/production databases.
- Review migrations before applying.
- Use least privilege and evaluate RLS based on actual architecture.
- Apply constraints and transactions for registration/payment integrity.

## Privacy and policy
- Do not invent retention, deletion, privacy, or legal policies. Record items requiring school approval.
- Do not publicly expose student lists or personal details.
- Collect only fields approved for admissions.
