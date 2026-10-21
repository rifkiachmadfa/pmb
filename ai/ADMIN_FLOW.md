# Alur Logika Dashboard Admin (Phase 8) — PROPOSED

> Status: **PROPOSED**. Dibuat atas permintaan owner (22 Okt 2026): "dashboard admin, fokus alur logika dahulu". Model peran/otorisasi BELUM disetujui sekolah; semua aturan di bawah adalah usulan yang sudah diimplementasikan sebagai logika murni + service server, TANPA UI, TANPA rute `/admin`, TANPA server action. Pemetaan ke kode ada di bagian 10. Keputusan terbuka ada di bagian 9.

## 1. Prinsip yang sudah APPROVED (tidak berubah)
- Status penerimaan hanya dapat diubah oleh petugas sekolah yang berwenang (BUSINESS_RULES 11, ADR-011).
- Pembayaran tidak pernah mengubah status penerimaan (BUSINESS_RULES 10). Dalam kode, pembayaran hanya menjadi *fakta* yang dibaca aturan; tidak ada jalur dari pembayaran ke `admissionStatus`.
- Siswa hanya melihat data miliknya sendiri (BUSINESS_RULES 14). Admin area tidak mengubah itu.
- Tiga status berdiri sendiri: pendaftaran, pembayaran, keputusan penerimaan.

## 2. Aktor
| Aktor | Sumber identitas | Boleh |
|---|---|---|
| Siswa (`STUDENT`) | Login Google (ADR-020) | Hanya data sendiri. Tidak ada izin admin. |
| Petugas (`ADMISSION_STAFF`) | Login Google yang sama; peran dibaca dari tabel `accounts` | Semua izin di bagian 6 (usulan satu peran). |
| Sistem | Webhook Midtrans, server | Mengubah status pembayaran (terverifikasi). Tidak menyentuh keputusan penerimaan. |

Peran dibaca dari **database aplikasi pada setiap permintaan**, bukan dari token Google/Supabase atau dari browser. Menurunkan peran petugas berlaku pada permintaan berikutnya (teruji).

## 3. Alur utama petugas
```
Masuk (Google)
  └─ akun ada? ── tidak ─► dibuat sebagai STUDENT (tidak bisa masuk area admin)
  └─ peran punya izin? ── tidak ─► 404 (area admin tidak diiklankan)
        │ ya
        ▼
Ringkasan ──► Daftar kerja (filter/cari/halaman) ──► Tinjau satu pendaftaran
                                                        │
                                  riwayat keputusan, riwayat pembayaran
                                                        ▼
                                              Tetapkan keputusan
                                                        │
              ┌─────────────────────────────────────────┤ satu transaksi DB, terkunci per pendaftaran
              ▼                                         ▼
   status berubah + 1 baris audit            ditolak aturan / konflik (tidak ada perubahan)
              ▼
   siswa melihat status baru di dashboard (BELUM dibuat; lihat bagian 9)
```

## 4. Tiga status independen
| Status | Nilai | Siapa mengubah | Lewat apa |
|---|---|---|---|
| Pendaftaran | `DRAFT` / `SUBMITTED` | Siswa (kirim) | `submitRegistration` |
| Pembayaran (turunan) | `NOT_STARTED`, `PENDING`, `PAID`, `FAILED`, `EXPIRED`, `CANCELED` | Sistem (notifikasi/sinkron Midtrans terverifikasi) | `src/server/payments/*` |
| Penerimaan | `PENDING` / `ACCEPTED` / `REJECTED` | Hanya petugas berwenang | `decideAdmission` |

Status pembayaran per pendaftaran diturunkan dengan aturan yang sama seperti dashboard siswa: ada percobaan `PAID` ⇒ `PAID`; jika tidak, percobaan terbaru; jika tidak ada, `NOT_STARTED` (`derivePaymentStatus`).

## 5. Mesin status keputusan penerimaan
Nilai: `PENDING` (default, "belum ditetapkan") → `ACCEPTED` | `REJECTED`.

Aturan (`evaluateDecision`, urutan pemeriksaan):
1. Pendaftaran harus `SUBMITTED` → `registration_not_submitted`.
2. Petugas tidak boleh memutuskan pendaftaran milik akunnya sendiri → `self_decision_forbidden`.
3. Target harus berbeda dari status sekarang → `same_status`.
4. Catatan dipangkas spasi; kosong = tidak ada; > 500 karakter ditolak (bukan dipotong) → `note_too_long`.
5. **Koreksi** (status sekarang bukan `PENDING`, termasuk mengembalikan ke `PENDING`) wajib catatan ≥ 5 karakter → `note_required`. Keputusan pertama dari `PENDING` tidak wajib catatan.
6. Opsi kebijakan `requirePaidForAcceptance` (default **false**): bila true, `ACCEPTED` butuh pembayaran `PAID`; `REJECTED`/`PENDING` tidak pernah butuh pembayaran → `payment_not_verified`.

Semua transisi antar tiga nilai diperbolehkan (termasuk `ACCEPTED ↔ REJECTED` dan kembali ke `PENDING`) selama lolos aturan di atas; setiap perubahan tercatat.

## 6. Izin (usulan)
Kode meminta **izin**, bukan nama peran. Tabel ada di `src/domain/staff-policy.ts`; satu-satunya tempat yang diubah bila sekolah menyetujui peran lebih halus.

| Izin | `STUDENT` | `ADMISSION_STAFF` |
|---|---|---|
| `registration:list` (ringkasan, daftar kerja) | – | ya |
| `registration:review` (tinjau satu pendaftaran) | – | ya |
| `admission:decide` | – | ya |
| `reconciliation:view` (antrean pembayaran bermasalah) | – | ya |

Peran tak dikenal ⇒ tanpa izin (deny by default; teruji untuk `__proto__`, `constructor`, dll.).

## 7. Pipeline `decideAdmission` (satu transaksi, terkunci)
1. Petugas ditentukan dari sesi terverifikasi (`getStaffAccount("admission:decide")`); bukan dari payload.
2. Payload divalidasi Zod: `registrationId` (uuid), `targetStatus`, `expectedStatus`, `note`. Kunci tambahan (`ownerId`, `admissionStatus`, …) diabaikan.
3. Transaksi: baca ulang peran petugas dari DB → kunci baris `registrations` (`FOR UPDATE`, sama dengan jalur pembayaran) → baca pendaftaran.
4. **Konkurensi optimistik**: jika status sekarang ≠ `expectedStatus` (yang dilihat petugas di layar) → `conflict` dengan status terkini; tidak menimpa diam-diam.
5. Terapkan `evaluateDecision` (bagian 5).
6. Tulis `registrations.admission_status` **dan** tambahkan satu baris `admission_decisions` (dari, ke, catatan, petugas, waktu). Keduanya berhasil atau gagal bersama (teruji dengan memaksa kegagalan insert audit ⇒ status kembali).

Hasil: `decided`, `invalid_input`, `forbidden`, `not_found`, `conflict`, `rejected{reason}`. Pesan Indonesia untuk tiap alasan: `DECISION_REJECTION_MESSAGES`.

## 8. Data yang terlihat petugas (minimisasi)
Daftar dan tinjauan hanya mengembalikan: nomor pendaftaran, **nama** siswa, jurusan, waktu kirim, tiga status, riwayat pembayaran (order id, status, nominal, waktu bayar), riwayat keputusan (termasuk email petugas pembuat). **Tidak** dikembalikan: NIK, NISN, No. KK, akta, data orang tua, alamat, telepon, `snapToken`. Apa yang boleh dilihat petugas dari data pribadi (dan apakah dimasker) adalah keputusan TERBUKA; sampai disetujui, data itu sengaja tidak diekspos.

Antrean rekonsiliasi: daftar baca-saja `PaymentEvent` yang terverifikasi tetapi **tidak diterapkan** (`*_needs_reconciliation`, ADR-026). Tidak ada kolom "selesai" dan tidak ada aksi penyelesaian; siapa menyelesaikan dan bagaimana (refund? gabung?) belum diputuskan.

## 9. Keputusan TERBUKA (butuh owner/sekolah)
1. **Siapa petugasnya dan bagaimana akunnya dibuat.** Akun baru selalu `STUDENT`; tidak ada UI untuk mengubah peran (ADR-020). Usulan sementara: owner mengubah `accounts.role` menjadi `ADMISSION_STAFF` lewat SQL/Supabase setelah orang tersebut login sekali. Belum disetujui.
2. Satu peran petugas atau lebih halus (hanya lihat vs boleh memutuskan; admin super)?
3. Apakah `ACCEPTED` mensyaratkan pembayaran awal `PAID` (opsi `requirePaidForAcceptance`)? Default sekarang: tidak.
4. Apakah koreksi keputusan boleh, dan oleh siapa? Saat ini boleh dengan alasan tertulis.
5. Kriteria resmi penerimaan, label hasil resmi (apakah hanya "Diterima/Ditolak"? ada "Cadangan"?), dan kapan hasil boleh tampil ke siswa (tanggal pengumuman?). Dashboard siswa **belum** menampilkan keputusan sama sekali.
6. Data pribadi apa yang boleh dilihat petugas, apakah dimasker, dan apakah akses lihat perlu dicatat.
7. Penyelesaian antrean rekonsiliasi dan kebijakan refund.
8. Larangan memutuskan pendaftaran milik sendiri: usulan; konfirmasi sekolah.

## 10. Peta kode
| File | Isi | Sifat |
|---|---|---|
| `src/domain/admission-decision.ts` | `evaluateDecision`, `normalizeNote`, pesan | murni, tanpa framework |
| `src/domain/payment-summary.ts` | `derivePaymentStatus`, sufiks rekonsiliasi | murni |
| `src/domain/staff-policy.ts` | `can(role, permission)` | murni |
| `src/server/admin/guard.ts` | `getStaffAccount` (action/API), `requireStaff` (halaman) | server-only |
| `src/server/admin/decide.ts` | `decideAdmission`, `decideAdmissionAs` | server-only, transaksi |
| `src/server/admin/queries.ts` | ringkasan, daftar kerja, tinjau, antrean rekonsiliasi | server-only, baca |
| `src/domain/*.test.ts` | 17 unit test (`npm test`, `node:test`) | |

Tidak ada perubahan skema Prisma atau migrasi: `Registration.admissionStatus`, `AdmissionDecision`, dan `AccountRole.ADMISSION_STAFF` sudah ada (ADR-018).

## 11. Yang BELUM dibuat (jangan diasumsikan ada)
- Rute/halaman `/admin/*`, layout, komponen UI, server action yang memanggil `decideAdmission`.
- Penambahan `/admin` ke `PROTECTED_PREFIXES` di `src/proxy.ts` (saat rute dibuat: proxy hanya optimistik; setiap halaman wajib `requireStaff`, setiap action wajib lewat `decide*`/`getStaffAccount`).
- Tampilan keputusan di dashboard siswa; notifikasi hasil penerimaan.
- Tampilan/ekspos data pribadi siswa untuk petugas; aksi penyelesaian rekonsiliasi.
- RLS Supabase untuk tabel terkait; rate limit; CSP.
