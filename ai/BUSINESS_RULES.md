# Business Rules

Status labels: APPROVED = agreed requirement; PROPOSED = draft for review; UNKNOWN = not yet decided.

## Approved requirements
1. Product is PMB SMK Yadika Tanjungsari Sumedang for admission period 2026/2027.
2. The registration form has five progressions: Ketentuan, Data Siswa, Data Orang Tua/Wali, Data Sekolah Asal, Konfirmasi.
3. User must create an account or sign in before accessing the registration form.
4. Account records exist regardless of whether the student has paid.
5. Each registration is linked to its authenticated account.
6. Student dashboard shows registration, payment, and admission status separately.
7. The first progression requires explicit acceptance of the five terms before continuing.
8. Initial payment is IDR 350,000 and is allocated toward the admission fee, not an additional fee.
9. Payment success is determined by server verification, not browser redirect.
10. Successful payment does not automatically mean the student is admitted.
11. Admission status may only be changed by authorized school personnel.
12. Fonnte notification is required after registration creation and after server-verified successful payment.
13. Fonnte failure must not invalidate registration or payment.
14. Students may access only their own private records.

## Official terms supplied by owner
1. Setiap calon siswa wajib mengisi form pendaftaran dengan lengkap.
2. Data-data yang diisikan pada form PPDB Online harus sesuai dengan data asli dan benar adanya.
3. Calon siswa yang sudah mendaftarkan secara online akan mendapatkan password serta dilampirkan dalam persyaratan yang diminta oleh Panitia PPDB MSMK YADIKA TANJUNGSARI SUMEDANG.
4. Calon siswa yang sudah mendaftarkan diri melalui PPDB Online SMK YADIKA TANJUNGSARI SUMEDANG wajib menyerahkan dokumen persyaratan yang sudah ditentukan oleh Panitia PPDB SMK YADIKA TANJUNGSARI SUMEDANG.
5. Data yang sudah diberikan kepada Panitia PPDB SMK YADIKA TANJUNGSARI SUMEDANG hanya digunakan untuk keperluan penerimaan siswa baru, tidak dipublikasikan, dan dijaga kerahasiaannya oleh Panitia PPDB.

Note: The phrase about receiving a password in term 3 must be reconciled with secure authentication. Prefer account creation and secure recovery; never send a plaintext password by WhatsApp/email. The owner/school should approve any revised wording.

## Student fields supplied by owner
Required as indicated by the original form:
- NISN; NIK; birth certificate number; family-card number; full name; gender; birthplace; birth date; religion; address; RT; RW; village/kelurahan; kecamatan; kabupaten; province; postal code; citizenship; KPS recipient and number; KIP recipient and number; name on KIP; birth order; number of siblings; height; weight; residence type; distance from home to school; transport; mobile number; telephone; email.
- If a KPS/KIP-related number is not available, the supplied form says enter "-". Exact conditional behavior and whether “recipient” itself may be “-” need confirmation.
- Required fields must be validated client- and server-side.
- Keep numeric-looking identifiers as strings.
- Official option lists for religion, gender, citizenship, residence type, transport, KPS/KIP must be confirmed.

## Proposed drafts — awaiting school review
### Parent/guardian
Relationship (father/mother/guardian), full name, NIK, birthplace/date of birth if required, education, occupation, monthly income range, mobile phone, optional email, address, and administrative location fields. Decide whether to collect one or multiple guardians and which fields are required.

### Previous school
School level, official name, NPSN, public/private status if needed, address/location, entry year, graduation year/expected year, optional exam participant number, optional diploma number. Make diploma-dependent fields optional when not yet issued.

## Unknown / requires approval
- Official parent/guardian and previous-school field list and requiredness.
- Whether account creation requires email, phone, or both; verification method.
- Whether one account may have multiple registrations.
- Registration editing policy after submission.
- Payment expiry, cancellation, refund, and reconciliation policy.
- Official admission criteria and admin roles.
- Notification templates, opt-in wording, and communication policy.
- Privacy notice, data retention, and deletion/correction procedures.
- Whether document uploads are required and which documents.
- The exact school policy for admission fee balance and allocation.
