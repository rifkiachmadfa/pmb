# Project Context

## Identity
- Project: PMB SMK Yadika Tanjungsari Sumedang
- Admission period: 2026/2027
- Product: Online student admission and status portal
- Primary language: Bahasa Indonesia
- Primary users: prospective students; authorized school admission staff will need an administrative workflow, to be specified separately.

## Product goal
Provide a straightforward, secure online registration flow. Students create an account before registering, complete five registration progressions, review and submit their information, pay an initial IDR 350,000 through Midtrans, and view their registration, payment, and admission statuses in their own dashboard.

## Intended technology
- Next.js App Router
- TypeScript
- Tailwind CSS and shadcn/ui
- Supabase PostgreSQL
- Prisma ORM
- Zod
- Authentication provider/design: to be confirmed during Phase 0; Supabase Auth is a candidate.
- Midtrans Snap
- Fonnte WhatsApp API
- GitHub

Exact versions, repository structure, deployment provider, and authentication design must be verified/selected in Phase 0.

## User journey
1. Create account or sign in.
2. Open the PMB form only when authenticated.
3. Accept terms in step 1.
4. Complete student data.
5. Complete parent/guardian data.
6. Complete previous-school data.
7. Review and confirm.
8. Registration is persisted and linked to the account.
9. Fonnte sends a registration-created notification.
10. Student can continue to the initial payment of IDR 350,000 via Midtrans.
11. Server verifies payment notification and updates payment status.
12. Fonnte sends a payment-confirmed notification.
13. Student sees payment and admission status separately in dashboard.

## Out of scope until approved
- Automatic admission decision based on payment.
- Unapproved official field lists or dropdown options.
- Public listing of student data.
- Unapproved document upload requirements.
- Unapproved admin roles, admission criteria, or legal policies.
- Automatic external verification of NISN/NIK against government systems.

## Known unknowns
- GitHub repository URL and existing repository state.
- Official parent/guardian fields.
- Official previous-school fields.
- Required/optional fields and official dropdown values for those steps.
- Exact authentication and account recovery policy.
- School admin workflow and authorized roles.
- Payment expiry, cancellation, refunds, and reconciliation policy.
- Notification message templates and consent wording.
- Deployment domain, hosting provider, and production credentials.
- Privacy notice, data retention, and access policy approved by the school.
