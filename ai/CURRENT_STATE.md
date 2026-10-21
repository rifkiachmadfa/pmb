# Current State

> Ringkasan kerja untuk melanjutkan coding. Verifikasi ulang hanya jika repository berubah atau status tidak jelas.

## Proyek
PMB SMK Yadika Tanjungsari Sumedang, tahun ajaran 2026/2027. Branch utama `main`. Stack: Next.js 16, React 19, TypeScript strict, Tailwind 4, Prisma 7, PostgreSQL/Supabase, Zod. Gunakan `package.json` dan lockfile sebagai sumber versi.

## Kondisi berdasarkan repository dan audit terakhir
- Fondasi aplikasi, konfigurasi server/env, Prisma schema, halaman placeholder, endpoint health, design tokens, komponen UI dasar, dan shared layout sudah tersedia.
- P2-1 (design tokens, komponen UI, shared shell) telah ada di branch `main`; riwayat yang diperiksa Claude menunjukkan commit `8dae5bf` sebagai commit UI terbaru.
- P2-2 (wizard lima langkah di `/pendaftaran`: stepper, Kembali/Lanjut, gerbang ketentuan, draft lokal di memori) IMPLEMENTED/TESTED; belum di-commit oleh owner. Langkah 2-4 masih placeholder tanpa field.
- P2-3 (login Google-only via Supabase Auth, `/masuk`, `/auth/callback`, proxy, `requireAccount()`, `/dashboard` placeholder) IMPLEMENTED; end-to-end dengan Supabase/Google asli UNTESTED (lihat handoff P2-3). Butuh setup: provider Google di Supabase, Redirect URL, env, tabel `accounts` di database.
- Belum tersedia: field form data siswa/orang tua/sekolah asal, persistence pendaftaran, isi dashboard (status), integrasi Midtrans/Fonnte, dan workflow admin.
- `prisma/schema.prisma` memiliki model domain, tetapi status migrasi/koneksi database perlu diverifikasi sebelum mengandalkannya. Jangan jalankan migrasi ke database bersama tanpa persetujuan.
- Auth provider: ADR-012 APPROVED (Supabase Auth, Google saja); implementasi ADR-020.
- `phase1.patch` dan `p2-1.patch` ada di repository. Jangan hapus atau menerapkan ulang otomatis; periksa apakah diperlukan sebelum tindakan apa pun.
- Folder dokumentasi adalah `ai/`, bukan `.ai/`.

## Langkah kerja berikutnya
Owner menyiapkan Supabase + Google OAuth lalu menguji login end-to-end (langkah di handoff P2-3). Setelah itu Phase 3 (field Data Siswa) bila owner meminta. Jangan menambahkan penyimpanan database, pembayaran, atau notifikasi sebelum fasenya.

## Verifikasi P2-2 (22 Okt 2026, sandbox)
- Dijalankan: `npm ci` (perlu `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true` karena `binaries.prisma.sh` tidak terjangkau), `npm run typecheck`, `npm run lint`, `npm run build` — semuanya lolos.
- Playwright/Chromium terhadap `next start` (desktop 1280px dan mobile 375px): Lanjut diblokir tanpa persetujuan + pesan error; centang menghapus error; fokus pindah ke judul langkah; Konfirmasi tanpa tombol Lanjut; Ubah kembali ke Ketentuan dengan centang tetap; batal centang mengembalikan ke langkah 1; tidak ada overflow horizontal.
- Belum dijalankan: unit test (belum ada runner), pembaca layar, browser lain, perangkat nyata. Draft hilang saat reload (by design).
- Catatan: teks ketentuan 3 menyebut "mendapatkan password"; redaksi perlu disetujui sekolah (ADR-013).

## Verifikasi P2-3 (22 Okt 2026, sandbox)
- Dijalankan: `npm run typecheck`, `npm run lint`, `npm run build` (lolos); `next start` dengan env placeholder: `/pendaftaran` dan `/dashboard` tanpa sesi -> 307 ke `/masuk?next=...`; `/auth/callback` tanpa code / dengan error / dengan code palsu -> `/masuk?error=...`; `/masuk` dan `/api/health` 200; `?next=//evil.com` diabaikan; tes ad-hoc `sanitizeNextPath` (11 kasus) lolos.
- Belum: login Google sungguhan, upsert Account ke database, refresh sesi, unit test runner, uji sesi terautentikasi.

## Cara menjaga status
Ini ringkasan operasional, bukan bukti semua tes masih lolos. Periksa kode/tes yang relevan saat mengubahnya. Setelah tugas, perbarui bagian ini hanya bila status atau langkah berikutnya berubah. Catat hasil tes sesuai perintah yang benar-benar dijalankan.
