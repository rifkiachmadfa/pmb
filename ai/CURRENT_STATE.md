# Current Project State

> This document must describe verified repository state, not intended future work.

## Project
- Name: PMB SMK Yadika Tanjungsari Sumedang
- Admission period: 2026/2027
- Status: DOCUMENTATION BASELINE PREPARED — REPOSITORY NOT YET AUDITED
- Current phase: Phase 0
- Repository URL: NOT PROVIDED
- Branch / last commit: NOT VERIFIED
- Last verified date: NOT VERIFIED

## Requirements agreed in conversation
- Five-step PMB registration flow.
- Student must have an account before accessing the registration form.
- Account must be recorded whether or not payment has been made.
- Registration must be linked to the authenticated account.
- Student dashboard shows registration, payment, and admission statuses separately.
- Initial payment: IDR 350,000, allocated toward the admission fee.
- Midtrans Snap for payment.
- Fonnte notifications after registration creation and after server-verified successful payment.
- Parent/guardian fields: draft required, awaiting school review.
- Previous-school fields: draft required, awaiting school review.

## Completed
- Initial requirements documented in this documentation package.
- Initial architecture and phase plan drafted.
- No application implementation verified.

## Not implemented / not verified
- Repository scaffold.
- Authentication.
- Registration form UI.
- Database schema and migrations.
- Registration persistence.
- Student dashboard.
- Midtrans integration.
- Fonnte integration.
- Admin admission workflow.
- Automated tests.
- Deployment.

## Blockers / decisions required
- Repository URL and initial Git state.
- Official parent/guardian field list and required-field policy.
- Official previous-school field list and required-field policy.
- Authentication design confirmation during Phase 0.
- Admin roles and admission decision workflow.
- Payment expiry, cancellation/refund policy.
- Approved privacy notice, retention, and communication wording.
- Provider accounts, credentials, domain, and deployment configuration.

## Verification
- Commands executed: NONE
- Build: NOT RUN
- Tests: NOT RUN
- Database: NOT CONNECTED
- Provider integrations: NOT CONFIGURED
- Production: NOT DEPLOYED

## Next task
Phase 0: inspect the actual repository, Git state, runtime versions, and dependencies; establish the real baseline; then finalize architecture and project docs.

## Handoff
This file is an initial documentation baseline only. It does not assert that a repository has been inspected or that code has been implemented.
