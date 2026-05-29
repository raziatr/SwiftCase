# SwiftCase POS — Backend API

Backend lengkap untuk aplikasi SwiftCase POS. Mengimplementasikan **secara nyata** semua poin
"Prioritas Menengah (keamanan & ketahanan)" dari daftar fitur, plus QRIS via **Xendit**.

| Fitur daftar | Implementasi nyata di sini |
|---|---|
| Rate Limiting | `express-rate-limit` — limiter umum + limiter ketat untuk login |
| `.env` config | `dotenv` + `src/config/index.js` (kredensial & JWT secret dari env) |
| Global Error Handler | `src/middleware/errorHandler.js` (JSON konsisten, sembunyikan internal di produksi) |
| Request Logging | `morgan` (`src/middleware/requestLogger.js`) + tabel audit `activity_logs` |
| Real-time Order Notif | **Server-Sent Events** `/api/events/orders` |
| Auth | JWT (`jsonwebtoken`) + hashing password (`bcryptjs`) |
| Multi-admin | tabel `admins` + peran `admin`/`kasir` |
| CRUD Produk / Stok | endpoint produk + transaksi stok |
| Laporan / CSV | endpoint laporan + export CSV |
| Pembayaran QRIS | integrasi **Xendit** QR Codes + webhook |

## Stack
- **Express 4** — web framework
- **node:sqlite** — database SQLite **bawaan Node** (Node ≥ 22.5), tanpa dependency native
- **jsonwebtoken**, **bcryptjs** — autentikasi
- **helmet**, **cors**, **express-rate-limit**, **morgan**, **dotenv**

## Menjalankan

```bash
cd backend
cp .env.example .env        # lalu sesuaikan bila perlu
npm install
npm run dev                 # atau: npm start
```

Server jalan di `http://localhost:4000`. Database & seed dibuat otomatis di `data/swiftcase.db`.

Akun seed:
- Admin: **admin / admin123**
- Pelanggan: **john@mail.com / 123456**

> Butuh **Node.js ≥ 22.5** (memakai modul `node:sqlite` & `fetch` bawaan).

## Menghubungkan dengan frontend
Di `SwiftCase (1).html`, `CONFIG.API_BASE` sudah disetel ke `http://localhost:4000/api`.
Saat backend hidup, pembayaran **QRIS** akan memanggil endpoint nyata. Set `CORS_ORIGIN`
di `.env` ke origin tempat HTML dibuka (mis. `http://localhost:8123`) atau biarkan `*` saat dev.

## QRIS / Xendit
- Tanpa `XENDIT_SECRET_KEY` → **mode MOCK**: QR & status dipalsukan agar alur lengkap bisa diuji
  lokal. Endpoint `POST /api/payments/:id/simulate-paid` menandai pembayaran lunas.
- Dengan secret key → memanggil `POST https://api.xendit.co/qr_codes` sungguhan.
- Webhook: arahkan Xendit ke `POST /api/webhooks/xendit` dan isi `XENDIT_CALLBACK_TOKEN`.
  Untuk uji lokal, gunakan tunnel (mis. `ngrok http 4000`).

## Ringkasan Endpoint

### Auth — `/api/auth`
| Method | Path | Akses | Keterangan |
|---|---|---|---|
| POST | `/register` | publik | daftar pelanggan |
| POST | `/login` | publik | login pelanggan → JWT |
| POST | `/admin/login` | publik | login admin/kasir → JWT |
| GET | `/me` | token | info token saat ini |

### Produk — `/api/products`
| GET | `/` | publik | daftar menu |
| GET | `/:id` | publik | detail |
| GET | `/low-stock` | staff | produk di bawah threshold |
| GET | `/export.csv` | staff | export CSV |
| POST | `/` | admin | tambah produk |
| PUT | `/:id` | admin | edit produk |
| PATCH | `/:id/stock` | staff | ubah stok (`{delta}` atau `{stock}`) |
| DELETE | `/:id` | admin | hapus produk |

### Pesanan — `/api/orders`
| POST | `/` | publik/pelanggan | buat pesanan (kurangi stok, transaksional) |
| GET | `/mine` | pelanggan | riwayat sendiri |
| GET | `/` | staff | daftar + pagination (`?status=&q=&page=&limit=`) |
| GET | `/new-count` | staff | jumlah pesanan baru (badge) |
| GET | `/export.csv` | staff | export CSV |
| GET | `/:id` | staff | detail |
| PATCH | `/:id/status` | staff | ubah status |

### Laporan — `/api/reports`
| GET | `/sales?range=7\|30\|all` | staff | ringkasan + tren + per produk |
| GET | `/sales/export.csv` | staff | export CSV |

### Admin & Kasir — `/api/admins` (khusus admin)
`GET /` · `POST /` · `PUT /:id` · `DELETE /:id`

### Pembayaran — `/api/payments`
| POST | `/qris` | publik | buat QRIS (`{amount, reference?}`) |
| GET | `/:id` | publik | status pembayaran (polling) |
| POST | `/:id/simulate-paid` | dev/mock | tandai lunas (uji lokal) |

### Webhook — `/api/webhooks/xendit`
Callback Xendit (verifikasi `x-callback-token`).

### Realtime — `/api/events/orders`
Stream SSE: event `order:new`, `order:update`, `payment:paid`.

### Log — `/api/logs` (khusus admin)
`GET /` · `GET /export.csv` · `DELETE /`

## Contoh cepat (cURL)

```bash
# Login admin
curl -s localhost:4000/api/auth/admin/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'

# Daftar produk
curl -s localhost:4000/api/products

# Buat pesanan
curl -s localhost:4000/api/orders -H 'Content-Type: application/json' \
  -d '{"customer":"Budi","items":[{"id":1,"qty":2,"note":"pedas"}],"payMethod":"Tunai"}'

# Buat QRIS
curl -s localhost:4000/api/payments/qris -H 'Content-Type: application/json' \
  -d '{"amount":50000}'
```

## Struktur
```
backend/
├── src/
│   ├── server.js            # entry point
│   ├── app.js               # setup express + middleware
│   ├── config/              # konfigurasi dari .env
│   ├── db/                  # koneksi sqlite, schema, seed
│   ├── middleware/          # auth, rateLimiter, logger, errorHandler, notFound
│   ├── utils/               # ApiError, jwt, password, csv, sse, asyncHandler
│   ├── models/              # akses data (users, admins, products, orders, payments, logs)
│   ├── services/            # xenditService, reportService
│   ├── controllers/         # logika tiap resource
│   └── routes/              # definisi endpoint
├── .env.example
└── package.json
```
