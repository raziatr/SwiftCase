# SwiftCase POS

Aplikasi **Point of Sale (POS)** untuk usaha kuliner — mendukung pemesanan oleh pelanggan, dapur/kasir, dan dashboard admin. Terdiri dari **frontend SPA satu file** (HTML + vanilla JS, tanpa build step) dan **backend REST API** (Node.js + Express + SQLite bawaan Node). Antarmuka **dwibahasa (Indonesia / English)** dan pembayaran **QRIS** via Xendit (mode mock untuk pengembangan lokal).

---

## ✨ Fitur Utama

- **Multi-peran**: pelanggan, kasir, dan admin dengan kontrol akses berbasis JWT.
- **Menu & keranjang**: kategori, foto/emoji produk, pencarian, scan barcode, catatan per item.
- **Diskon**: per item dan per pesanan (persen/nominal), aturan minimal belanja & kedaluwarsa.
- **PPN 11%** otomatis (dapat dikonfigurasi/ dimatikan).
- **Pembayaran**: Tunai, Kartu, dan **QRIS (Xendit)** dengan webhook konfirmasi.
- **Manajemen stok**: stok produk, bahan baku (ingredients), riwayat pergerakan stok, peringatan stok menipis.
- **CRM pelanggan**: data pelanggan, tanggal bergabung, dan lama keanggotaan.
- **Laporan & ekspor**: penjualan, pesanan, log, stok, pelanggan — ekspor **CSV, XLSX, PDF** dengan filter rentang waktu (hari ini, kemarin, 7/30 hari, 1 tahun, semua, kustom).
- **Audit trail**: log aktivitas dengan before/after untuk data master.
- **Dwibahasa (ID/EN)**: seluruh antarmuka mengikuti bahasa yang dipilih pengguna.
- **Keamanan**: Helmet, CORS, rate limiting, bcrypt, dukungan HTTPS/TLS.
- **Backup database** otomatis terjadwal.

---

## 🧱 Arsitektur

```
SwiftCase/
├─ SwiftCase.html          # Frontend SPA (sumber utama)
└─ backend/
   ├─ public/index.html    # Salinan frontend yang dilayani server
   ├─ src/
   │  ├─ server.js         # Entry point (HTTP/HTTPS + seed + backup)
   │  ├─ app.js            # Express app, middleware, static, routes
   │  ├─ config/           # Konfigurasi terpusat dari .env
   │  ├─ routes/           # Definisi endpoint REST
   │  ├─ controllers/      # Logika request/response
   │  ├─ models/           # Akses data (node:sqlite)
   │  ├─ middleware/       # auth, rate limit, error handler, upload
   │  ├─ services/         # backup, pembayaran, dll.
   │  └─ db/               # database, migrasi, seed
   └─ package.json
```

- **Frontend**: satu file `SwiftCase.html` (vanilla JS, tanpa framework/build). Saat dijalankan lewat backend, file ini disalin ke `backend/public/index.html`.
- **Backend**: Express + **`node:sqlite`** (SQLite bawaan Node ≥ 22.5, tanpa dependensi native — `npm install` selalu lancar).
- **Database**: file SQLite (`backend/data/swiftcase.db`) dengan migrasi & seed otomatis saat boot.

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js ≥ 22.5** (wajib, karena memakai modul `node:sqlite`)

### Langkah

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Pasang dependensi
npm install

# 3. (Opsional) salin & sesuaikan konfigurasi
cp .env.example .env

# 4. Jalankan server (mode pengembangan, auto-reload)
npm run dev
#   atau mode produksi:
npm start
```

Buka di browser: **http://localhost:4000**

Saat pertama kali dijalankan, database otomatis dibuat dan diisi data contoh (produk, diskon, pelanggan, bahan baku) beserta akun admin default.

### Akun Default
| Peran | Username | Password |
|-------|----------|----------|
| Admin | `admin`  | `admin123` |

> ⚠️ Ganti `ADMIN_PASSWORD` dan `JWT_SECRET` sebelum dipakai di produksi.

### Skrip NPM
| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan server dengan auto-reload |
| `npm start` | Jalankan server (produksi) |
| `npm run seed` | Isi ulang data awal |
| `npm run backup` | Backup database manual |
| `npm run gen-cert` | Buat sertifikat TLS self-signed (HTTPS) |

---

## ⚙️ Konfigurasi (.env)

Semua nilai sensitif dibaca dari environment (lihat `backend/.env.example`):

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `4000` | Port server |
| `JWT_SECRET` | *(dev default)* | **Wajib diganti di produksi** |
| `TAX_RATE` | `0.11` | PPN (0 untuk menonaktifkan) |
| `LOW_STOCK_THRESHOLD` | `5` | Ambang stok menipis |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `admin123` | Akun admin awal |
| `XENDIT_SECRET_KEY` | *(kosong)* | Kosong = **mode MOCK** QRIS; isi untuk QRIS asli |
| `SSL_KEY_FILE` / `SSL_CERT_FILE` | *(kosong)* | Aktifkan HTTPS bila keduanya diisi |
| `BACKUP_ENABLED` | `true` | Backup database otomatis |

---

## 🔌 Ringkasan API

Base URL: `/api`

| Grup | Endpoint | Fungsi |
|------|----------|--------|
| Auth | `/auth` | Login/registrasi pelanggan & admin |
| Produk | `/products` | Menu, stok, barcode, ekspor CSV/XLSX |
| Kategori | `/categories` | Kelola kategori |
| Pesanan | `/orders` | Buat & kelola pesanan |
| Diskon | `/discounts` | Aturan diskon item/pesanan |
| Pelanggan | `/customers` | CRM pelanggan |
| Bahan baku | `/ingredients` | Stok bahan baku |
| Pergerakan stok | `/stock-movements` | Riwayat stok |
| Pembayaran | `/payments` | QRIS Xendit |
| Webhook | `/api/webhooks` | Callback pembayaran Xendit |
| Laporan | `/reports` | Penjualan + ekspor CSV/XLSX/PDF |
| Admin | `/admins` | Kelola akun staf |
| Log | `/logs` | Audit trail |
| Realtime | `/events` | Server-Sent Events (notifikasi) |

Cek kesehatan server: `GET /health`

---

## 🔒 HTTPS (opsional)

```bash
cd backend
npm run gen-cert          # buat certs/key.pem & certs/cert.pem
# tambahkan ke .env:
#   SSL_KEY_FILE=./certs/key.pem
#   SSL_CERT_FILE=./certs/cert.pem
npm run dev
```
Server otomatis berjalan via HTTPS bila kedua file sertifikat tersedia.

---

## 📄 Lisensi

MIT
