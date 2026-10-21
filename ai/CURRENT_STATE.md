# Current State

> Ringkasan operasional untuk melanjutkan coding. Bukan bukti semua tes masih lolos; periksa kode/tes yang relevan saat mengubahnya. Diperbarui 22 Okt 2026 (penutupan Phase 0-6 oleh owner). Riwayat per-task ada di `CHANGELOG.md` dan `handoff/`.

## Proyek
PMB SMK Yadika Tanjungsari Sumedang 2026/2027. Branch `main`. Stack: Next.js 16, React 19, TypeScript strict, Tailwind 4, Prisma 7, PostgreSQL/Supabase, Supabase Auth (Google saja), Zod, Midtrans Snap. Versi sebenarnya: `package.json` + lockfile. Folder dokumentasi adalah `ai/` (bukan `.ai/`).

## Status fase
- Phase 0-6: SELESAI, ditutup oleh owner pada 22 Okt 2026. Penutupan = keputusan owner; bukti uji ada di handoff dan "Catatan verifikasi" di bawah, bukan klaim PRODUCTION-VERIFIED.
- Phase 7 (Fonnte): DILEWATI sementara atas permintaan owner. Dikerjakan nanti.
- Phase 8 (dashboard status + keputusan penerimaan): LANGKAH BERIKUTNYA.
- Phase 9-10: belum dimulai.

## Yang sudah ada
- Auth: login Google via Supabase (`/masuk`, `/auth/callback`, `src/proxy.ts`, `requireAccount()`), baris `accounts` di-upsert saat masuk. Keputusan: ADR-012, ADR-020.
- Wizard `/pendaftaran` lima langkah (Ketentuan, Data Siswa, Data Orang Tua/Wali, Data Sekolah Asal, Konfirmasi) dengan validasi Zod bersama klien-server (`src/features/registration/*-schema.ts`) dan server action `validateStudentStep/ParentsStep/SchoolStep`. Draf hanya di memori (hilang saat muat ulang).
- Penyimpanan: `submitRegistration` (satu transaksi: registrasi, siswa, wali, sekolah asal, baris outbox `REGISTRATION_CREATED`), nomor `PMB-XXXX-XXXX`, satu pendaftaran per akun per periode, tanpa edit setelah kirim. Migrasi: `setup`, `registration_persistence`.
- Pembayaran awal Rp350.000 (Midtrans Snap): buat/reuse percobaan, webhook `POST /api/payments/midtrans/notification` (signature, identitas order, nominal tersimpan, mata uang, transisi status, idempoten via `PaymentEvent.eventKey`), sinkron status saat kembali dari browser (`refreshPaymentStatus`), baris outbox `PAYMENT_VERIFIED` saat PAID, kartu pembayaran + popup Snap di `/dashboard`. Pembayaran tidak mengubah `admissionStatus`. Keputusan: ADR-025 (+ amandemen tanpa cek awalan kunci), ADR-026, ADR-027.
- Dashboard `/dashboard`: status pendaftaran dan kartu pembayaran. Status keputusan penerimaan belum ada.

## Celah dan utang teknis yang diketahui
- Outbox `REGISTRATION_CREATED` dan `PAYMENT_VERIFIED` terus dibuat dengan status PENDING; belum ada pengirim WhatsApp (Phase 7 dilewati), jadi baris menumpuk.
- `refreshPaymentStatus` belum punya rate limit (tiap kunjungan dashboard dengan percobaan PENDING memanggil Midtrans sekali).
- Belum ada CSP; saat ditambahkan (Phase 9) izinkan `app.sandbox.midtrans.com` / `app.midtrans.com`.
- Belum ada unit test runner permanen; uji sebelumnya berupa skrip sementara (tidak di-commit).
- Belum ada workflow admin, termasuk rekonsiliasi event bertanda `*_needs_reconciliation`.
- Alur sandbox Midtrans penuh (popup, simulator, webhook asli) dan login Google + server action dengan sesi asli belum terbukti oleh Claude di sandbox; owner yang menguji secara lokal.

## Keputusan terbuka (perlu persetujuan sekolah/owner)
- Asumsi bidang/aturan: ADR-021 (siswa), ADR-022 (orang tua/wali), ADR-023 (sekolah asal, jurusan), ADR-024 (nomor pendaftaran, tanpa edit setelah kirim) berstatus PROPOSED.
- Kebijakan pembayaran: masa berlaku 24 jam, kebijakan refund (refund/chargeback tidak mengubah status), siapa merekonsiliasi event bermasalah.
- Redaksi ketentuan 3 menyebut "mendapatkan password" (ADR-013).
- Phase 8: kebijakan peran/otorisasi petugas (siapa boleh menetapkan keputusan penerimaan) BELUM disetujui; workflow admin tidak boleh dibuat sebelum itu.

## Langkah berikutnya: Phase 8
1. Dashboard siswa: tampilkan tiga status terpisah (pendaftaran, pembayaran, keputusan penerimaan) dengan keputusan default "belum ditetapkan"; hanya data milik akun sendiri.
2. Workflow admin keputusan penerimaan hanya setelah owner menyetujui model peran/otorisasi (tanya owner: siapa petugasnya, bagaimana login, perlu jejak audit?).
3. Perbarui `ai/` di task yang sama.

## Catatan verifikasi (ringkas)
- Sandbox Claude: `npm ci` butuh `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true`. Typecheck, lint, build lolos pada tiap task terakhir (P6-5 termasuk).
- Logika penyimpanan registrasi diuji pada PostgreSQL 16 lokal (32 pemeriksaan); logika pembayaran/webhook diuji pada PostgreSQL 16 lokal dengan `fetch` Midtrans palsu (171 pemeriksaan + 3 mutation check). Bukan Supabase.
- UI kartu pembayaran diuji di Chromium (status, nonaktif tanpa konfigurasi, klik tanpa sesi); bundle klien bersih dari kunci server.
- Rincian per task: `ai/handoff/*.md` dan `CHANGELOG.md`.