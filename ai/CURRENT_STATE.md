# Current State

> Ringkasan operasional untuk melanjutkan coding. Bukan bukti semua tes masih lolos; periksa kode/tes yang relevan saat mengubahnya. Diperbarui 22 Okt 2026 (P8-1: logika admin). Riwayat per-task ada di `CHANGELOG.md` dan `handoff/`.

## Proyek
PMB SMK Yadika Tanjungsari Sumedang 2026/2027. Branch `main`. Stack: Next.js 16, React 19, TypeScript strict, Tailwind 4, Prisma 7, PostgreSQL/Supabase, Supabase Auth (Google saja), Zod, Midtrans Snap. Versi sebenarnya: `package.json` + lockfile. Folder dokumentasi adalah `ai/` (bukan `.ai/`).

## Status fase
- Phase 0-6: SELESAI, ditutup oleh owner pada 22 Okt 2026. Penutupan = keputusan owner; bukti uji ada di handoff dan "Catatan verifikasi" di bawah, bukan klaim PRODUCTION-VERIFIED.
- Phase 7 (Fonnte): DILEWATI sementara atas permintaan owner. Dikerjakan nanti.
- Phase 8 (dashboard status + keputusan penerimaan): IN_PROGRESS. P8-1 (22 Okt 2026) = logika admin tanpa UI/rute (ADR-028, `ADMIN_FLOW.md`), PROPOSED. Dashboard siswa untuk keputusan dan UI admin belum ada.
- Phase 9-10: belum dimulai.

## Yang sudah ada
- Auth: login Google via Supabase (`/masuk`, `/auth/callback`, `src/proxy.ts`, `requireAccount()`), baris `accounts` di-upsert saat masuk. Keputusan: ADR-012, ADR-020.
- Wizard `/pendaftaran` lima langkah (Ketentuan, Data Siswa, Data Orang Tua/Wali, Data Sekolah Asal, Konfirmasi) dengan validasi Zod bersama klien-server (`src/features/registration/*-schema.ts`) dan server action `validateStudentStep/ParentsStep/SchoolStep`. Draf hanya di memori (hilang saat muat ulang).
- Penyimpanan: `submitRegistration` (satu transaksi: registrasi, siswa, wali, sekolah asal, baris outbox `REGISTRATION_CREATED`), nomor `PMB-XXXX-XXXX`, satu pendaftaran per akun per periode, tanpa edit setelah kirim. Migrasi: `setup`, `registration_persistence`.
- Pembayaran awal Rp350.000 (Midtrans Snap): buat/reuse percobaan, webhook `POST /api/payments/midtrans/notification` (signature, identitas order, nominal tersimpan, mata uang, transisi status, idempoten via `PaymentEvent.eventKey`), sinkron status saat kembali dari browser (`refreshPaymentStatus`), baris outbox `PAYMENT_VERIFIED` saat PAID, kartu pembayaran + popup Snap di `/dashboard`. Pembayaran tidak mengubah `admissionStatus`. Keputusan: ADR-025 (+ amandemen tanpa cek awalan kunci), ADR-026, ADR-027.
- Dashboard `/dashboard`: status pendaftaran dan kartu pembayaran. Status keputusan penerimaan belum tampil.
- Logika admin (P8-1, PROPOSED, tidak terjangkau dari browser): `src/domain/{admission-decision,payment-summary,staff-policy}.ts` (murni), `src/server/admin/{guard,decide,queries}.ts` (`decideAdmission`: transaksi + kunci baris + konflik optimistik + audit; ringkasan, daftar kerja, tinjau, antrean rekonsiliasi baca-saja). Tanpa perubahan skema. Unit test: `npm test` (`node:test`, 17 tes).

## Celah dan utang teknis yang diketahui
- Outbox `REGISTRATION_CREATED` dan `PAYMENT_VERIFIED` terus dibuat dengan status PENDING; belum ada pengirim WhatsApp (Phase 7 dilewati), jadi baris menumpuk.
- `refreshPaymentStatus` belum punya rate limit (tiap kunjungan dashboard dengan percobaan PENDING memanggil Midtrans sekali).
- Belum ada CSP; saat ditambahkan (Phase 9) izinkan `app.sandbox.midtrans.com` / `app.midtrans.com`.
- Runner permanen hanya untuk logika murni (`npm test`, `node:test`). Uji DB/integrasi (registrasi, pembayaran, admin) masih skrip sementara yang tidak di-commit.
- Belum ada UI/rute admin. Rekonsiliasi event `*_needs_reconciliation` baru bisa DIBACA (service); penyelesaiannya belum ada (kebijakan belum diputuskan, tidak ada kolom "selesai").
- Alur sandbox Midtrans penuh (popup, simulator, webhook asli) dan login Google + server action dengan sesi asli belum terbukti oleh Claude di sandbox; owner yang menguji secara lokal.

## Keputusan terbuka (perlu persetujuan sekolah/owner)
- Asumsi bidang/aturan: ADR-021 (siswa), ADR-022 (orang tua/wali), ADR-023 (sekolah asal, jurusan), ADR-024 (nomor pendaftaran, tanpa edit setelah kirim) berstatus PROPOSED.
- Kebijakan pembayaran: masa berlaku 24 jam, kebijakan refund (refund/chargeback tidak mengubah status), siapa merekonsiliasi event bermasalah.
- Redaksi ketentuan 3 menyebut "mendapatkan password" (ADR-013).
- Phase 8: kebijakan peran/otorisasi petugas BELUM disetujui. Logika P8-1 memakai usulan (satu peran `ADMISSION_STAFF`, koreksi wajib alasan, larangan memutuskan milik sendiri, pembayaran tidak wajib untuk ACCEPTED). Daftar keputusan terbuka lengkap: `ADMIN_FLOW.md` bagian 9. Rute/UI admin jangan dibuat/dipublikasikan sebelum owner menyetujui, terutama cara akun petugas dibuat.

## Langkah berikutnya: Phase 8 (lanjutan)
1. Owner menjawab keputusan terbuka di `ADMIN_FLOW.md` bagian 9 (terutama: siapa petugas dan cara akunnya dibuat).
2. Dashboard siswa: tiga status terpisah dengan keputusan default "belum ditetapkan" (perlu keputusan kapan hasil boleh tampil).
3. UI admin `/admin` (tambahkan ke `PROTECTED_PREFIXES`, `requireStaff` di tiap halaman, server action tipis yang memanggil `decideAdmission`).
4. Perbarui `ai/` di task yang sama.

## Catatan verifikasi (ringkas)
- Sandbox Claude: `npm ci` butuh `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true`. Typecheck, lint, build lolos pada tiap task terakhir (P6-5 termasuk).
- Logika penyimpanan registrasi diuji pada PostgreSQL 16 lokal (32 pemeriksaan); logika pembayaran/webhook diuji pada PostgreSQL 16 lokal dengan `fetch` Midtrans palsu (171 pemeriksaan + 3 mutation check). Bukan Supabase.
- UI kartu pembayaran diuji di Chromium (status, nonaktif tanpa konfigurasi, klik tanpa sesi); bundle klien bersih dari kunci server.
- P8-1: typecheck, lint, build (dengan env placeholder), 17 unit test, dan skrip integrasi sementara pada PostgreSQL 16 lokal (86 pemeriksaan + 3 mutation check: hapus cek konflik, hapus kunci baris, hapus cek peran di transaksi; semuanya terdeteksi). Bukan Supabase, tanpa sesi login nyata.
- Rincian per task: `ai/handoff/*.md` dan `CHANGELOG.md`.