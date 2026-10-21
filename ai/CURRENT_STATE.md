# Current State

> Ringkasan kerja untuk melanjutkan coding. Verifikasi ulang hanya jika repository berubah atau status tidak jelas.

## Proyek
PMB SMK Yadika Tanjungsari Sumedang, tahun ajaran 2026/2027. Branch utama `main`. Stack: Next.js 16, React 19, TypeScript strict, Tailwind 4, Prisma 7, PostgreSQL/Supabase, Zod. Gunakan `package.json` dan lockfile sebagai sumber versi.

## Kondisi berdasarkan repository dan audit terakhir
- Fondasi aplikasi, konfigurasi server/env, Prisma schema, halaman placeholder, endpoint health, design tokens, komponen UI dasar, dan shared layout sudah tersedia.
- P2-1 (design tokens, komponen UI, shared shell) telah ada di branch `main`; riwayat yang diperiksa Claude menunjukkan commit `8dae5bf` sebagai commit UI terbaru.
- Belum tersedia: autentikasi, proteksi route, wizard pendaftaran, form data siswa, persistence pendaftaran, dashboard, integrasi Midtrans/Fonnte, dan workflow admin.
- `prisma/schema.prisma` memiliki model domain, tetapi status migrasi/koneksi database perlu diverifikasi sebelum mengandalkannya. Jangan jalankan migrasi ke database bersama tanpa persetujuan.
- Auth provider masih keputusan PROPOSED (ADR-012). Jangan membangun integrasi auth spesifik sebelum keputusan itu diperlukan/disetujui. Wizard visual/state lokal dapat dikerjakan tanpa auth.
- `phase1.patch` dan `p2-1.patch` ada di repository. Jangan hapus atau menerapkan ulang otomatis; periksa apakah diperlukan sebelum tindakan apa pun.
- Folder dokumentasi adalah `ai/`, bukan `.ai/`.

## Langkah kerja berikutnya
Lanjutkan Phase 2 dengan wizard lima langkah: Ketentuan, Data Siswa, Data Orang Tua/Wali, Data Sekolah Asal, Konfirmasi. Mulai dari stepper, navigasi Kembali/Lanjut, persetujuan ketentuan, dan draft state lokal. Jangan menambahkan autentikasi, penyimpanan database, pembayaran, atau notifikasi dalam tugas wizard awal.

## Cara menjaga status
Ini ringkasan operasional, bukan bukti semua tes masih lolos. Periksa kode/tes yang relevan saat mengubahnya. Setelah tugas, perbarui bagian ini hanya bila status atau langkah berikutnya berubah. Catat hasil tes sesuai perintah yang benar-benar dijalankan.
