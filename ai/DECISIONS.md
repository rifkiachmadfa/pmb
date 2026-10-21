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
Status: SUPERSEDED by the owner-supplied field list (22 Okt 2026, P4-1); implemented per ADR-022. Address and email fields from the earlier draft are NOT collected.

## ADR-008 — Previous-school form
Status: SUPERSEDED by the owner-supplied field list (22 Okt 2026, P4-2); implemented per ADR-023. NPSN, school level, entry year, exam/diploma numbers are NOT collected.

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
Status: APPROVED BY OWNER INSTRUCTION (2026-10-22): Supabase Auth with Google as the ONLY sign-in method (no email/password, no magic link). See ADR-020 for the implementation.

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

## ADR-020 — Google-only auth with Supabase Auth + Prisma Account (P2-3)
Status: APPROVED (owner: Google-only for simplicity); implementation UNVERIFIED against a real Supabase project.
- Packages (exact): `@supabase/supabase-js` 2.117.3, `@supabase/ssr` 0.12.7. Chosen ≥14 days old; newer 2.118.0 deliberately skipped.
- Flow: server action `signInWithGoogle` -> Google -> `/auth/callback` (PKCE `exchangeCodeForSession`) -> `ensureAccount()` upserts `Account` (provider subject = `authProviderId`, lowercase email, role STUDENT) -> redirect to sanitized `next`. Every login is recorded, paid or not.
- Session = Supabase cookies via `@supabase/ssr`. Server identity uses `getClaims()` (JWT verified), never `getSession()`.
- `src/proxy.ts` (Next 16 name for middleware) refreshes the session and redirects unauthenticated visitors from `/pendaftaran` and `/dashboard` to `/masuk?next=`. This is OPTIMISTIC only; each private page calls `requireAccount()`, and future private endpoints/actions must do the same plus an ownership check.
- `?next=` is accepted only as a same-origin relative path (`sanitizeNextPath`).
- No service-role key, no password storage. Only public URL + publishable key are used (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- Account recovery = Google account recovery (no password reset UI exists). Staff roles (`ADMISSION_STAFF`) are NOT assignable through any UI; role changes need an approved, separate mechanism.
- Known limits: a pre-existing Account with the same email but another `authProviderId` makes sign-in fail with a generic error (no automatic linking). Supabase RLS on `accounts` is not configured (Prisma connects as DB owner; no client-side table access is used).

## ADR-021 — Data Siswa validation defaults (PROPOSED, awaiting school approval)
- One pure Zod module (`src/features/registration/student-schema.ts`) is used by the browser (usability) and by the server action `validateStudentStep` (the real check, which also verifies the session). It validates only; nothing is stored until Phase 5.
- Formats assumed from Indonesian standards, not from the school: NISN 10 digits, NIK 16 digits, No. KK 16 digits, postal code 5 digits, mobile `08…`/`+62`/`62` (stored as `08…`), No. Akta free-form (letters/digits/`./-`, max 50).
- KPS/KIP convention (owner form: "isi dengan -"): recipient `Tidak` => number/name is `-` and stored as `null`; recipient `Ya` => a real value is required and `-` is rejected. Landline: `-` => `null`. The `Ya`/`Tidak` select itself cannot be `-`. School must confirm.
- Option lists (religion, residence type, transport, citizenship, gender) are taken from the owner's form; "Kristen Katolik" / "Kristen Protestan" and "Bersama Orang Tua" / "Wali" are an interpretation of the pasted text. Birth-year list kept as 1990-2024 per the form.
- Sanity bounds (not school policy): height 100-250 cm, weight 20-200 kg, distance 0-1000 km, birth order 1-30, siblings 0-30. Height/weight are integers because the schema columns are integers (precision still OPEN).
- Browser gate: leaving Data Siswa (Lanjut or stepper) requires a valid draft; server re-validates on Lanjut. Final server validation of the whole registration happens again in Phase 5 persistence.
- Server action never logs or echoes submitted values; responses contain only field names and fixed messages.

## ADR-022 — Data Orang Tua / Wali (P4-1; field list from owner, defaults PROPOSED)
- Field list is the owner's form: for Ayah, Ibu, Wali: NIK, Nama Lengkap, Tahun Lahir, Pendidikan, Pekerjaan, Penghasilan, No. Handphone (7 fields x 3 = 21). No address/email. Education/occupation/income options are verbatim from the form (incl. "Tdk Sekolah", "Sudah Meninggal" for Ayah only, "Telah Meninggal" for Ibu only).
- Requiredness (interpretation of the form notes): every field must be filled. Ayah/Ibu: only No. Handphone may be "-" (stored `null`). Wali: any field may be "-" (the form says "Jika tidak ada isi dengan -").
- PROPOSED, not school-approved: (a) Wali is all-or-nothing: either all 7 fields are "-" (no guardian, no row stored) or the 6 core fields are real values (phone may still be "-"); mixed input is rejected. (b) Wali option lists are not in the form: assumed = Ayah's list without "Sudah Meninggal", plus "-". (c) Birth year accepted 1930-2010 (4 digits). (d) NIK 16 digits; the same NIK cannot be used for two of Ayah/Ibu/Wali. (e) Phone format same as Data Siswa. (f) A deceased parent still requires NIK/name/year/income as the form lists them; income has no "not applicable" option.
- Same architecture as ADR-021: pure Zod module `guardian-schema.ts` shared by browser and server action `validateParentsStep` (verifies session, no storage, no logging, no value echo). Leaving step 3 requires a valid draft.
- OPEN for Phase 5: Prisma `ParentGuardian` has `birthDate` (and unused `birthPlace`, `email`, address columns) but the form collects only birth YEAR. Needs a reviewed migration (e.g. add `birthYear SmallInt`) once the owner approves; schema was deliberately NOT changed in P4-1 because migration `20261021140415_setup` may already be applied.

## ADR-023 — Data Sekolah Asal + Jurusan (P4-2; field list from owner, defaults PROPOSED)
- Field list is the owner's form, all required: Asal Sekolah, Status Sekolah (NEGERI/SWASTA), Alamat Sekolah, Tahun Lulus (2026 down to 2010), Jurusan. Options verbatim from the form.
- PROPOSED, not school-approved: (a) the form's run-on major list is split into three: Teknik Kendaraan Ringan Otomotif, Teknik Komputer dan Jaringan, Otomatisasi Tata Kelola Perkantoran; (b) school name: letters/digits/space and `. , ' ( ) / & -`, max 150; address: free text, max 255; (c) graduation year is a closed list, so future years and years before 2010 are rejected.
- Same architecture as ADR-021/022: pure Zod module `school-schema.ts` shared by browser and server action `validateSchoolStep` (session check, no storage, no logging, no value echo). Leaving step 4 requires a valid draft.
- Prisma mapping for Phase 5: schoolName -> `PreviousSchool.schoolName`, schoolStatus -> `ownership` (store as given), schoolAddress -> `streetAddress`, graduationYear -> `graduationYear`. OPEN: the chosen major (Jurusan) has NO column anywhere (it is registration data, not school data); needs a reviewed migration (e.g. `Registration.chosenMajor`). Schema NOT changed in P4-2.
- Cleanup: unused `step-placeholder.tsx` and `DraftSection` type removed (all five steps now have real content).

## ADR-024 — Registration persistence (P5-1; PROPOSED, awaiting owner/school approval)
- Persistence happens ONCE, at "Kirim Pendaftaran" (step 5). Steps 2-4 stay validate-only and the draft stays in browser memory (no localStorage: personal data). Consequence: reloading before submitting loses the draft; after submitting nothing is lost. Per-step server drafts (`Registration.status = DRAFT`, `lastCompletedStep`) remain possible later if the owner wants them; the current code refuses to treat an unexpected DRAFT row as submitted.
- Everything is written in one Prisma interactive transaction, including a `NotificationDelivery` outbox row (`REGISTRATION_CREATED`, `PENDING`, dedupe key `registration:<id>:REGISTRATION_CREATED`). A provider can never fail the registration because nothing is sent here (Phase 7 sends).
- Duplicate protection = DB unique `(owner_id, admission_period)` (ADR-018). A concurrent/repeated submit gets `already_submitted` with the original number. One registration per account per period is still an unapproved business assumption.
- Registration number (format OPEN in schema): `PMB-XXXX-XXXX`, random from 31 unambiguous characters, unique-constrained, retried on collision. Random, not sequential, so numbers cannot be enumerated. Owner/school may prefer another format.
- Terms: server stores `termsAcceptedAt` + `termsVersion` (`TERMS_VERSION` in `src/config/admission.ts`, currently `2026-10-22-draft`). Bump it when ADR-013 wording is approved.
- Schema additions (additive, nullable): `Registration.chosenMajor` (Jurusan label; promote to enum once the major list is approved) and `ParentGuardian.birthYear`. Mapping: father/mother/guardian -> FATHER/MOTHER/GUARDIAN rows (guardian row omitted when "no guardian"); schoolStatus -> `PreviousSchool.ownership`; schoolAddress -> `streetAddress`.
- Ownership: the owner id is never read from the payload; extra payload keys (`ownerId`, `status`, `admissionStatus`, `registrationNumber`) are ignored. Reads (`getOwnRegistration`) filter by `ownerId`.
- Logging: the action logs only error name + code (Prisma messages may embed submitted values).
- No edit-after-submit flow exists; the UI says so. Whether/when applicants may edit is OPEN.

