# INSIGHT K3 di repository ATLAS

Source INSIGHT K3 disimpan terpisah agar perubahan K3 tidak mengganggu ATLAS,
SIGMA, atau LRM.

Insight K3 memerlukan Node.js 20.19 atau lebih baru untuk mengikuti versi Vite
dan backend pada source ini.

```text
apps/insight-k3/
├── frontend/   # React + Vite
└── backend/    # Express + Prisma + PostgreSQL
```

## Kenapa tidak langsung dijalankan oleh GitHub Pages?

GitHub Pages hanya melayani file statis hasil build. INSIGHT K3 memiliki API
Express, autentikasi, Prisma, dan database PostgreSQL, sehingga backend harus
berjalan di hosting server seperti Railway, Render, VPS, atau layanan sejenis.

ATLAS tetap dipublikasikan di GitHub Pages. Kartu **INSIGHT K3** membuka portal
yang dapat diarahkan ke URL frontend K3 setelah frontend tersebut dideploy.

## Menjalankan frontend K3 di laptop

Buka Terminal di folder repository, lalu jalankan:

```bash
cd apps/insight-k3/frontend
npm install
copy .env.example .env
npm run dev -- --port 5174
```

Pada PowerShell, perintah penyalinan `.env` dapat ditulis sebagai:

```powershell
Copy-Item .env.example .env
```

Frontend menggunakan `http://localhost:3000/api` sebagai alamat backend default.
Contoh backend sudah disiapkan dengan `CORS_ORIGIN=http://localhost:5174`
agar tidak berbenturan dengan ATLAS yang berjalan di port 5173.

## Menjalankan backend K3 di laptop

Buka Terminal kedua dari folder repository:

```bash
cd apps/insight-k3/backend
npm install
copy .env.example .env
npm run db:generate
npm run db:deploy
npm run dev
```

Pada PowerShell:

```powershell
Copy-Item .env.example .env
```

Sebelum `db:deploy`, isi `DATABASE_URL` di `apps/insight-k3/backend/.env`
dengan koneksi PostgreSQL milik komputer atau server yang digunakan. Jangan
pernah mengunggah `.env` ke GitHub.

## Menghubungkan kartu ATLAS ke frontend K3

Setelah frontend K3 memiliki URL publik, buka file `.env` pada root repository
dan isi:

```env
VITE_INSIGHT_K3_URL=https://alamat-frontend-insight-k3.example
```

Kemudian jalankan build dan push ulang repository. Kartu INSIGHT K3 di ATLAS
akan membuka URL tersebut pada tab baru.

URL API untuk frontend K3 diatur terpisah di
`apps/insight-k3/frontend/.env`:

```env
VITE_API_URL=https://alamat-backend-insight-k3.example/api
```

Backend harus mengizinkan origin frontend melalui `CORS_ORIGIN` di
`apps/insight-k3/backend/.env`.
