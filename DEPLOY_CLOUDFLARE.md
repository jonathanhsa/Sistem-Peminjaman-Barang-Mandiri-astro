# Panduan Deploy SIPEMBAR ke Cloudflare Pages / Workers

Aplikasi **SIPEMBAR (Sistem Peminjaman Barang Mandiri Kampus)** telah disesuaikan agar **100% siap produksi (Production-Ready)** dan kompatibel dengan ekosistem **Cloudflare** (Cloudflare Pages, Workers, dan Database Cloudflare D1).

---

## 1. Pembersihan Elemen Demo (Production Polish)

Seluruh komponen tampilan yang bersifat demo/simulasi telah dihilangkan dan diganti dengan standar produksi:
- ✅ **Halaman Login (`/login`)**: Tombol isi demo cepat ("Jonathan", "Admin") dan tautan lembar barcode uji coba telah dihapus. Digantikan dengan form login institusi resmi, tautan registrasi mahasiswa baru, dan informasi bantuan.
- ✅ **Halaman Peminjaman (`/pinjam`)**: Tombol pintasan kode buku ("LIB-LAR-101", dll.) telah dibersihkan. Digantikan dengan tautan resmi ke Katalog Inventaris Kampus (`/katalog`).
- ✅ **Dialog Scanner (`ScannerDialog`)**: Kode sampel cepat 1-klik pada mode ketik manual dan layar kendala kamera telah dibersihkan, menyisakan opsi penanganan nyata: Nyalakan Ulang Kamera, Unggah Foto Barcode, Ketik Manual, atau Buka Katalog.
- ✅ **Halaman Cetak Label (`/test-barcode`)**: Ditransformasikan menjadi modul resmi administratif cetak label stiker inventaris fisik perpustakaan (Code 128 + QR Code + Label OCR).

---

## 2. Cara Deploy ke Cloudflare Pages via Dashboard (Rekomendasi)

### Langkah A: Hubungkan Repository Git ke Cloudflare Pages
1. Push project ini ke repository GitHub atau GitLab Anda:
   ```bash
   git add .
   git commit -m "feat: ready for cloudflare deployment"
   git push origin main
   ```
2. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Pilih repository project ini.

### Langkah B: Pengaturan Build (Build Settings)
Pada halaman konfigurasi build Cloudflare Pages, atur:
- **Framework preset**: `Astro`
- **Build command**: `npm run build:cloudflare` (atau `npm run build` jika environment variable `CF_PAGES=1` aktif)
- **Build output directory**: `dist`
- **Node.js Version** (di Environment variables): `NODE_VERSION` = `22.12.0` (atau `20.x`)

---

## 3. Menghubungkan Cloudflare D1 (Database SQLite di Edge)

Cloudflare D1 adalah database SQLite serverless milik Cloudflare yang berjalan langsung di jaringan edge.

### Langkah 1: Buat Database D1
Jalankan di terminal lokal Anda (pastikan sudah login Wrangler dengan `npx wrangler login`):
```bash
npx wrangler d1 create sipembar-db
```
Catat `database_id` yang dihasilkan, misalnya: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.

### Langkah 2: Perbarui `wrangler.jsonc`
Buka file `wrangler.jsonc` dan masukkan `database_id` Anda:
```jsonc
{
  "name": "sipembar-kampus",
  "compatibility_date": "2026-10-01",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "sipembar-db",
      "database_id": "MASUKKAN_DATABASE_ID_ANDA_DISINI"
    }
  ]
}
```

### Langkah 3: Inisialisasi Tabel & Data Awal (1 Perintah)
Jalankan file schema SQL yang telah disiapkan langsung ke Cloudflare D1:
```bash
# Untuk D1 Cloudflare di Cloud (Production):
npm run d1:init:remote

# Atau menggunakan perintah wrangler:
npx wrangler d1 execute sipembar-db --file=./d1-schema.sql --remote
```

### Langkah 4: Sambungkan D1 Binding di Cloudflare Pages Dashboard
1. Masuk ke proyek Pages Anda di Cloudflare Dashboard.
2. Buka menu **Settings** > **Functions** > **D1 database bindings**.
3. Klik **Add binding**:
   - **Variable name**: `DB`
   - **D1 database**: Pilih `sipembar-db`
4. Simpan perubahan.

---

## 4. Deploy Langsung via CLI (Alternatif Cepat)

Jika Anda ingin deploy langsung dari terminal tanpa Git:
```bash
# 1. Build untuk Cloudflare
npm run build:cloudflare

# 2. Deploy ke Cloudflare Pages
npx wrangler pages deploy dist
```

---

## 5. Ringkasan Perintah Penting

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server development lokal (Node.js mode) |
| `npm run build` | Build standar untuk Node.js environment |
| `npm run build:cloudflare` | Build khusus Cloudflare Pages / Workers SSR |
| `npm run d1:init:local` | Inisialisasi schema & seed di D1 lokal |
| `npm run d1:init:remote` | Inisialisasi schema & seed di Cloudflare D1 production |
| `npx astro check` | Verifikasi integritas tipe TypeScript & Astro |
