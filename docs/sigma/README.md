# SIGMA Dashboard

**Security Patrol, Asset Monitoring, Visibility, Risk, and Monitoring Assurance Dashboard**

Prototype ini dibuat berdasarkan konsep yang sudah dikunci:

- Tidak menggunakan nama atau modul **Atlas**.
- Dashboard sekarang menggunakan **real online basemap demo** melalui Leaflet: **Satellite (Esri World Imagery)** dan **OpenStreetMap**, lengkap dengan overlay jalur patroli, filter waktu, point interaktif, popup data, dan pembacaan visibility berbasis track. Peta final dan engine GIS tetap dapat diganti oleh system developer tim.
- Panel peta memiliki tombol **Perluas** untuk membuka tampilan **peta saja** dalam viewport yang lebih besar; tutup dengan tombol **Kembalikan**, klik area luar, atau tekan `Escape`.
- Terdapat dua akses berbeda: **Authorized User** dan **SSL Administrator**.
- Patroli merupakan satu aktivitas gabungan: **Security & Asset Patrol**.
- Mendukung fixed asset, mobile asset, dan material/stock asset.
- Rekomendasi patroli bersifat fleksibel berdasarkan risk, hotspot, visibility gap, temuan, dan asset criticality.
- Laporan lapangan divalidasi oleh admin SSL berdasarkan GPS/tracking, koordinat, foto/evidence, timestamp, dan data lapangan.
- User dapat membuat laporan PDF dan Excel.
- Tersedia **night mode** dan **light mode**.

## 1. Teknologi

- React 18
- Vite
- TypeScript
- React Router
- Recharts
- Lucide Icons
- jsPDF + jsPDF AutoTable
- SheetJS/XLSX
- Firebase SDK scaffold

Untuk tahap review visual ini, data disimpan di **localStorage browser** agar dapat langsung dijalankan tanpa membuat project Firebase terlebih dahulu. File konfigurasi Firebase, Firestore Rules, dan rancangan collection sudah disiapkan untuk tahap integrasi berikutnya.

## 2. Cara menjalankan di VS Code

### A. Ekstrak ZIP

1. Ekstrak file `SIGMA_DASHBOARD_LOCALHOST_V5_REAL_MAP_SATELLITE_OSM.zip`.
2. Letakkan folder hasil ekstrak di lokasi yang mudah ditemukan, misalnya:

```text
C:\SIGMA\sigma-dashboard
```

### B. Buka dengan VS Code

1. Buka VS Code.
2. Klik **File > Open Folder**.
3. Pilih folder `sigma-dashboard`.
4. Pastikan file `package.json` terlihat di panel Explorer.

### C. Pastikan Node.js tersedia

Buka terminal VS Code melalui:

```text
Terminal > New Terminal
```

Lalu jalankan:

```bash
node -v
npm -v
```

Rekomendasi: Node.js 20 atau 22.

### D. Instal dependency

Di terminal yang berada pada folder project, jalankan:

```bash
npm install
```

Tunggu sampai selesai. Folder `node_modules` akan dibuat otomatis.

### E. Jalankan localhost

```bash
npm run dev
```

Terminal akan menampilkan alamat seperti:

```text
http://localhost:5173
```

Tekan `Ctrl` sambil klik alamat tersebut, atau buka melalui browser.

## 3. Cara masuk

Halaman awal menyediakan dua pilihan demo tanpa password.

### Authorized User

Untuk manajemen atau orang yang ditunjuk.

Hak akses:

- melihat dashboard dan seluruh data monitoring;
- memantau patroli, aset, visibility, risk, hotspot, findings, dan performance;
- melakukan filter dan melihat histori;
- membuat laporan PDF dan Excel;
- tidak dapat mengubah official operational record.

### SSL Administrator

Untuk admin dari Social, Security, Legal Department.

Hak akses:

- seluruh akses Authorized User;
- memasukkan laporan patroli;
- mencatat tracking reference dan koordinat;
- mendaftarkan atau memperbarui aset;
- mencatat finding, incident, atau anomaly;
- memvalidasi laporan lapangan;
- meminta revisi atau menolak laporan;
- mengelola akun demo.

Anda juga dapat berpindah role dari menu profil kanan atas.

## 4. Halaman yang tersedia

```text
Dashboard
├── Patrol Monitoring
├── Asset Monitoring
├── Visibility
├── Risk & Hotspot
├── Findings
├── Performance
└── Reports

SSL Administration
├── Data Entry
├── Validation Queue
└── User Management
```

## 5. Fitur utama yang dapat diuji

### Dashboard

- KPI patroli, aset, temuan, visibility, risk, dan verified monitoring.
- Interactive basemap: Satellite + OpenStreetMap untuk demo wilayah Kalimantan Timur.
- Demo GPS tracking overlay untuk Kutai Timur dan Penajam Paser Utara.
- Pulsing point markers yang dapat diklik untuk membuka popup data area.
- Tombol **Perluas** untuk melihat **peta saja** dengan area viewport yang lebih besar tanpa menutupi topbar atau sidebar.
- Filter waktu 1 hari, 3 hari, 1 minggu, 1 bulan, dan semua data demo.
- Filter status route untuk verified atau pending review.
- Coverage dan visibility yang dibaca dari rute yang tampil pada peta.
- Visibility overview.
- Critical attention.
- Enam Monitoring Assurance Layers.
- Operational recommendations.
- Recent operational activity.

### Patrol Monitoring

- Filter berdasarkan status.
- Search berdasarkan patrol code, team, area, atau focus.
- Detail drawer setiap patrol.
- Tracking reference.
- Export Excel.

### Asset Monitoring

- Fixed asset.
- Mobile asset.
- Material/stock asset seperti fuel dan fertilizer.
- Location, coordinates, last seen, condition, criticality, dan visibility score.
- Search dan filter.
- Export Excel.

### Visibility

Visibility menggambarkan tingkat kemutakhiran, kelengkapan, dan keterpercayaan data area atau aset.

Komponen utamanya:

- recency;
- monitoring coverage;
- evidence completeness;
- admin validation;
- current asset/location information.

### Risk & Hotspot

Prioritas patroli didasarkan pada:

- incident dan finding severity;
- visibility gap;
- asset criticality;
- coverage deficiency;
- action delay.

### Data Entry

Admin dapat memasukkan:

- laporan patrol;
- pemilihan demo route template untuk langsung diuji di map overlay;
- asset baru atau update asset;
- finding, incident, atau anomaly.

### Validation Queue

Admin dapat:

- memeriksa schedule;
- memeriksa GPS/tracking points;
- memeriksa evidence;
- memeriksa observed assets dan findings;
- memberikan validation note;
- verify;
- request revision;
- reject.

### Reports

Tersedia template:

- Daily Patrol Report;
- Weekly Monitoring Assurance;
- Asset & Area Visibility Report;
- High-Risk Area Report;
- Monthly Executive Summary.

Masing-masing dapat dibuat dalam PDF dan Excel.

## 6. Night mode dan light mode

Klik ikon matahari/bulan pada topbar.

Pilihan theme disimpan di localStorage, sehingga tetap digunakan ketika browser dibuka kembali.

## 7. Data demo dan reset

Data yang dimasukkan selama pengujian disimpan di browser.

Untuk kembali ke data awal:

1. Klik profil kanan atas.
2. Pilih **Reset demo data**.

Atau hapus Local Storage melalui browser DevTools.

## 8. Struktur folder

```text
sigma-dashboard/
├── docs/
│   ├── DATA_MODEL.md
│   └── FIREBASE_INTEGRATION.md
├── public/
│   └── sigma-mark.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   ├── context/
│   ├── data/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 9. Build production

Setelah seluruh revisi selesai, jalankan:

```bash
npm run build
```

Hasil build akan berada di folder:

```text
dist
```

Untuk melihat hasil build:

```bash
npm run preview
```

## 10. Firebase

Pada tahap ini aplikasi tetap menggunakan localStorage supaya review UI dapat dilakukan segera.

Untuk menyiapkan environment:

1. Salin `.env.example` menjadi `.env`.
2. Isi konfigurasi Firebase.
3. Ubah:

```env
VITE_DATA_MODE=firebase
```

Namun perubahan tersebut belum otomatis memindahkan seluruh data ke Firestore. Repository Firestore perlu dihubungkan setelah struktur data, workflow, dan revisi UI sudah disetujui. Panduan rancangan tersedia di `docs/FIREBASE_INTEGRATION.md`.

## 11. Catatan map

Tidak ada library map yang dipasang dalam package ini.

Area map di dashboard sengaja dibuat sebagai komponen:

```text
src/components/ui/MapPlaceholder.tsx
```

System developer dapat menggantinya dengan komponen map internal tanpa perlu mengubah struktur dashboard lain.

---

## Revision V2 — Collapsible Navigation

The dashboard sidebar is now **collapsed by default on all screen sizes**. Use the three-line menu button in the top-left corner to open the navigation drawer. The sidebar closes when a menu item, the close button, the dark backdrop, or the `Esc` key is used. Dashboard content now uses the full available width while the navigation is closed.


## Catatan V5 real basemap demo

- Basemap membutuhkan koneksi internet saat localhost berjalan karena tile Satellite/OpenStreetMap dimuat online.
- Titik dan jalur pada prototype adalah koordinat ilustratif untuk demo interaksi, bukan koordinat konsesi resmi.
- Untuk penggunaan operasional, ganti dengan polygon konsesi tervalidasi dan track GPX/KML/CSV/GPS aktual.
