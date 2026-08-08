# ATLAS + SIGMA + LRM + INSIGHT K3

Repositori ini menggabungkan tiga aplikasi yang tetap dipisahkan agar mudah direvisi:

- `src/atlas/` — aplikasi ATLAS Webmap.
- `src/sigma/` — aplikasi SIGMA Operational Monitoring.
- `src/lrm/` — aplikasi LRM (Land Recovery Monitoring).
- `apps/insight-k3/frontend/` — frontend INSIGHT K3.
- `apps/insight-k3/backend/` — API Express, Prisma, dan PostgreSQL INSIGHT K3.
- `public/assets/` — aset dan data SHP milik ATLAS.
- `public/sigma/` — aset logo SIGMA.
- `docs/sigma/` — dokumentasi dan berkas Firebase SIGMA.
- `docs/lrm/` — catatan sumber LRM.

## Cara menjalankan di laptop

Syarat: Node.js 18.18 atau lebih baru.

```bash
npm install
npm run dev
```

Buka alamat yang diberikan Vite, biasanya `http://localhost:5173/`.

- ATLAS: `http://localhost:5173/`
- SIGMA: `http://localhost:5173/sigma/`
- LRM: `http://localhost:5173/lrm/`

SIGMA masih memakai akun demo dan `localStorage`, sehingga belum membutuhkan Firebase untuk dicoba.

## Cara merevisi

- Jika mengubah peta, kartu dashboard, berita, atau tampilan ATLAS, buka `src/atlas/`.
- Jika mengubah halaman, menu, data demo, atau tampilan SIGMA, buka `src/sigma/`.
- Jika mengubah dashboard pemulihan lahan, buka `src/lrm/`.
- Jika menambah gambar ATLAS, simpan di `public/assets/`.
- Jika mengganti logo SIGMA, ganti `public/sigma/sigma-mark.svg`.

Jangan mengunggah folder `node_modules/`; folder itu dibuat otomatis oleh `npm install` di setiap laptop.

## Build lokal

```bash
npm run build
npm start
```

Build juga membuat `dist/404.html` agar rute seperti `/sigma/dashboard` tetap dapat dibuka saat di-refresh di GitHub Pages.

## GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` akan membangun dan menerbitkan aplikasi setiap kali ada push ke branch `main`.

Di GitHub, buka `Settings → Pages`, lalu pilih:

1. `Source: GitHub Actions`.
2. Pastikan repository dapat memakai Pages. Repository private pada akun tertentu dapat membutuhkan paket/upgrade GitHub.

Setelah workflow berhasil, alamatnya berbentuk:

`https://galihhrestu.github.io/atlas/`

SIGMA dapat dibuka dari kartu `SIGMA` di ATLAS atau langsung melalui:

`https://galihhrestu.github.io/atlas/sigma/`

LRM dapat dibuka dari kartu `LRM` di ATLAS atau langsung melalui:

`https://galihhrestu.github.io/atlas/lrm/`

## INSIGHT K3

INSIGHT K3 disimpan di `apps/insight-k3/` karena memiliki backend Express dan
database PostgreSQL. GitHub Pages tidak menjalankan backend tersebut. Baca
`apps/insight-k3/README.md` untuk menjalankan frontend/backend di laptop dan
menghubungkan kartu INSIGHT K3 ke URL frontend publik.

Kartu `INSIGHT K3` di ATLAS membuka portal internal. Untuk build GitHub Actions,
isi `INSIGHT_K3_URL` sebagai **Repository variable** di GitHub melalui
`Settings → Secrets and variables → Actions → Variables → New repository variable`.
Workflow akan memasukkannya sebagai `VITE_INSIGHT_K3_URL` saat build. Jika
variabel belum diisi, portal tetap tampil tetapi memberi tahu bahwa URL K3 belum
terhubung.
