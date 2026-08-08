# INSIGHTK3 Backend — Tahap 1

Backend dasar menggunakan Express, Prisma ORM, dan PostgreSQL.

## Yang sudah tersedia

- Struktur backend terpisah dari frontend.
- Validasi environment variable.
- Keamanan header melalui Helmet.
- CORS terkontrol.
- Rate limiting dasar.
- Request ID.
- Health check API.
- Pemeriksaan koneksi PostgreSQL.
- Prisma schema dan initial migration.
- Konfigurasi Railway.
- Graceful shutdown.

## Menjalankan secara lokal

```bash
cd server
copy .env.example .env
npm install
npm run db:generate
npm run db:deploy
npm run dev
```

Pastikan `DATABASE_URL` di `.env` menunjuk ke PostgreSQL yang aktif.

## Endpoint

- `GET /`
- `GET /api/health`
- `GET /api/database-status`

## Batas Tahap 1

Frontend belum dihubungkan ke API. Seluruh fitur lama tetap menggunakan `localStorage` agar tidak rusak selama backend dibangun.
