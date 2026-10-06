# 📦 Sistem Peminjaman Barang Mandiri (SIPEMBAR)

Sistem Peminjaman Barang Mandiri berbasis web modern yang dibangun dengan **Astro 5**, **React**, **Tailwind CSS v4**, dan **Drizzle ORM**. Mendukung database **SQLite** untuk development lokal dan **Cloudflare D1** untuk deployment serverless di Cloudflare Pages.

---

## ✨ Fitur Utama

- 🔍 **Katalog & Pencarian Barang**: Eksplorasi ketersediaan barang secara real-time.
- 📷 **Barcode / QR Code Scanner**: Scan langsung barang menggunakan kamera perangkat atau upload gambar untuk peminjaman cepat.
- 📋 **Alur Peminjaman Mandiri**: Formulir peminjaman dengan verifikasi data dan status persetujuan.
- ⏱️ **Riwayat & Pengembalian**: Lacak status peminjaman aktif, riwayat pengembalian, dan keterlambatan.
- 🛡️ **Autentikasi & Hak Akses**: Role-based access control (User & Administrator).
- ⚙️ **Panel Administrator**: Kelola inventaris barang, persetujuan peminjaman, pengguna, dan log aktivitas.
- ☁️ **Hybrid Deployment Ready**: Dapat dijalankan di Node.js (SQLite) maupun Cloudflare Pages + D1.

---

## 🚀 Panduan Memulai (Development)

### 1. Prasyarat
- Node.js version `>= 22.12.0`
- npm / pnpm / yarn

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Inisialisasi Database Lokal
```bash
# Mengisi data awal (seed database lokal)
npm run seed
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Akses aplikasi melalui browser di `http://localhost:4321`.

---

## 🛠️ Script yang Tersedia

| Command | Keterangan |
| :--- | :--- |
| `npm run dev` | Menjalankan server dev Astro lokal |
| `npm run build` | Melakukan build aplikasi untuk Node.js |
| `npm run build:cloudflare` | Build khusus target Cloudflare Pages / Workers |
| `npm run preview` | Meninjau hasil build lokal |
| `npm run seed` | Menjalankan seeding data awal ke SQLite |
| `npm run d1:init:local` | Inisialisasi skema ke Cloudflare D1 (lokal) |
| `npm run d1:init:remote` | Inisialisasi skema ke Cloudflare D1 (remote) |

---

## 🌐 Deployment ke Cloudflare Pages

Panduan lengkap mengenai setup Cloudflare D1 dan deployment dapat dilihat pada [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md).

---

## 📄 Lisensi
MIT License
