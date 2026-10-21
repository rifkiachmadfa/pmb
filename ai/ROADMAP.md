# Roadmap

Statuses: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `SKIPPED` (ditunda atas permintaan owner), `VERIFICATION_REQUIRED`.

| Phase | Scope | Status |
|---|---|---|
| 0 | Audit repo, baseline kebutuhan, dokumen `ai/`, keputusan stack/auth | COMPLETED (owner, 22 Okt 2026) |
| 1 | Fondasi Next.js, TypeScript, UI, Supabase/Postgres, Prisma | COMPLETED (owner, 22 Okt 2026) |
| 2 | Shell responsif, auth Google, kerangka wizard lima langkah | COMPLETED (owner, 22 Okt 2026) |
| 3 | Data siswa dan validasi | COMPLETED (owner, 22 Okt 2026); asumsi ADR-021 menunggu sekolah |
| 4 | Orang tua/wali dan sekolah asal | COMPLETED (owner, 22 Okt 2026); asumsi ADR-022/023 menunggu sekolah |
| 5 | Konfirmasi dan penyimpanan pendaftaran | COMPLETED (owner, 22 Okt 2026); ADR-024 PROPOSED |
| 6 | Midtrans (buat transaksi, webhook, sinkron status, Snap UI) | COMPLETED (owner, 22 Okt 2026); ADR-025..027 PROPOSED |
| 7 | Notifikasi Fonnte (pendaftaran dibuat, pembayaran terverifikasi) | SKIPPED (ditunda owner; baris outbox sudah dibuat, belum dikirim) |
| 8 | Dashboard status + keputusan penerimaan; workflow admin sesuai kebijakan yang disetujui | NEXT (admin menunggu kebijakan peran) |
| 9 | Review keamanan, aksesibilitas, QA end-to-end dan jalur gagal | NOT_STARTED |
| 10 | Deployment, konfigurasi produksi, serah terima operasional | NOT_STARTED |

## Kebijakan penutupan fase
"COMPLETED (owner)" berarti owner menutup fase; bukan klaim PRODUCTION-VERIFIED. Bukti uji dan celah yang diketahui ada di `CURRENT_STATE.md`. Fase hanya dianggap terverifikasi produksi setelah bukti nyata dicatat (Phase 9-10).

## Fokus saat ini
Phase 8. Jangan mengerjakan Phase 7 sebelum owner meminta. Detail ada di `CURRENT_STATE.md` ("Langkah berikutnya").