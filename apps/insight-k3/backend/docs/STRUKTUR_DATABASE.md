# Struktur Database INSIGHTK3 — Tahap 1

Database menggunakan PostgreSQL dan dikelola melalui Prisma ORM.

## Tabel utama

| Tabel | Fungsi |
|---|---|
| `users` | Akun, role, status, dan identitas pengguna |
| `incidents` | Laporan kejadian dan workflow utama |
| `investigations` | Hasil penyelidikan dan root cause |
| `corrective_actions` | Tindakan, PIC, target, progres, efektivitas |
| `investigation_updates` | Riwayat perkembangan investigasi |
| `management_reviews` | Keputusan review management |
| `attachments` | Metadata file bukti dan dokumen |
| `audit_logs` | Rekam aktivitas yang tidak bergantung browser |

## Status incident

`PENDING → INVESTIGATION → CORRECTIVE_ACTION → MANAGEMENT_REVIEW → CLOSED`

Cabang lain:

- `PENDING → REJECTED`
- `MANAGEMENT_REVIEW → REVISION_REQUIRED → INVESTIGATION/CORRECTIVE_ACTION`

## Catatan

Pada Tahap 1 tabel sudah disiapkan, tetapi frontend masih menggunakan `localStorage`.
Migrasi data frontend dilakukan bertahap pada tahap berikutnya agar fungsi lama tidak rusak.
