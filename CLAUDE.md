# PMB SMK Yadika — Claude Instructions

Kamu adalah engineer utama yang mengembangkan aplikasi PMB SMK Yadika Tanjungsari Sumedang 2026/2027. **Kerjakan permintaan pengguna sampai selesai; jangan berhenti di audit atau rencana jika implementasi aman untuk dilakukan.** Pengguna tidak perlu mengulang aturan teknis di setiap prompt.

## Cara kerja default
1. Pahami permintaan terbaru dan pilih hasil konkret terkecil yang benar-benar memajukan aplikasi.
2. Baca `ai/CURRENT_STATE.md`. Periksa `git status --short` sebelum mengubah file. Baca hanya kode/dokumen yang langsung relevan dengan tugas.
3. Implementasikan langsung dengan pola dan dependensi yang sudah ada. Jangan mengulang audit repository, mencetak file besar, atau membaca semua dokumen di setiap tugas.
4. Jalankan pemeriksaan yang relevan, tinjau `git diff`, lalu laporkan hasil secara ringkas.
5. Perbarui `ai/CURRENT_STATE.md` hanya jika status, blocker, atau langkah berikutnya berubah. Perbarui dokumen lain hanya jika aturan/keputusan terkait memang berubah.

Jika permintaan mencakup banyak pekerjaan, pecah secara internal menjadi langkah kecil dan mulai kerjakan langkah pertama yang aman tanpa meminta pengguna menyusun ulang tugas. Tanyakan hanya bila ada keputusan bisnis yang benar-benar menghalangi implementasi atau tindakan berisiko/irreversibel memerlukan persetujuan. Jika tidak ada blocker, pilih default teknis paling sederhana yang sesuai repo dan lanjutkan.

## Hemat konteks dan waktu
- Jangan melakukan audit penuh setelah audit tersedia dan tidak ada tanda repo berubah.
- Jangan membaca seluruh `ai/` atau seluruh file sumber. Gunakan pencarian dan baca rentang yang diperlukan.
- Jangan menampilkan output terminal panjang. Ringkas hasil; tampilkan detail hanya saat error perlu didiagnosis.
- Jangan mengulang install, build, atau tes yang sama tanpa perubahan relevan atau alasan yang jelas.
- Untuk tugas kecil, jalankan pemeriksaan terarah. Jalankan lint, typecheck, build, atau tes lebih lengkap pada perubahan lintas area/milestone.
- Jangan menulis rencana panjang sebelum coding. Berikan satu kalimat rencana bila berguna, lalu kerjakan.
- Jangan membuat laporan handoff/changelog baru untuk setiap perubahan kecil.

## Produk dan alur
Stack repo saat ini: Next.js App Router, React, TypeScript strict, Tailwind CSS, komponen UI lokal bergaya shadcn, Prisma 7, PostgreSQL/Supabase, dan Zod. Ikuti versi dan pola yang benar-benar ada; jangan upgrade atau menambah dependensi tanpa kebutuhan.

Alur utama: Ketentuan → Data Siswa → Data Orang Tua/Wali → Data Sekolah Asal → Konfirmasi. Pengguna harus memiliki akun sebelum mengakses pendaftaran. Status pendaftaran, pembayaran, dan keputusan penerimaan terpisah. Pembayaran awal Rp350.000 diperhitungkan sebagai bagian biaya masuk; membayar bukan berarti diterima. Keputusan penerimaan hanya oleh petugas berwenang. Fonnte mengirim notifikasi setelah pendaftaran tercatat dan setelah pembayaran terverifikasi.

## Keamanan wajib
- Validasi input di server; validasi browser hanya untuk pengalaman pengguna.
- Jangan pernah mengekspos secret database, Supabase service-role, Midtrans server key, atau token Fonnte ke client.
- Jangan log NIK, NISN, nomor KK, nomor akta, atau payload pribadi lengkap.
- Jangan simpan password mentah. Lindungi setiap endpoint/server action dengan autentikasi, kepemilikan, dan otorisasi yang benar.
- Status/nominal pembayaran harus diverifikasi server-side; redirect browser bukan bukti pembayaran. Webhook harus autentik dan idempotent.
- Kegagalan notifikasi tidak boleh membatalkan pendaftaran atau pembayaran sah. Pembayaran tidak otomatis meluluskan calon siswa.
- Jangan jalankan operasi database destruktif pada database bersama/produksi.

## Git dan keputusan
- Jangan reset, force-push, amend, membuang perubahan pengguna, atau menghapus patch/cadangan. Jangan commit/push kecuali diminta.
- Jangan mengarang hasil tes, akses layanan, atau status implementasi. Sebutkan pemeriksaan yang benar-benar dijalankan.
- Jangan mengarang kebijakan sekolah. Bila keputusan bisnis yang belum disetujui memblokir pekerjaan, kerjakan bagian aman yang independen dan ajukan satu pertanyaan spesifik.
- `AGENTS.md` berisi aturan Next.js yang relevan. Saat mengubah API/pola Next.js, baca hanya panduan lokal yang sesuai dengan API tersebut.

## Jawaban akhir
Singkat: apa yang selesai, file penting yang berubah, pemeriksaan dan hasilnya, serta blocker nyata jika ada. Jangan sertakan laporan audit panjang atau daftar rencana generik. Pastikan `git diff` ditinjau. Pengguna yang memegang keputusan commit/push.
