'use strict';
/**
 * Konfigurasi terpusat — semua nilai sensitif & tunable dibaca dari
 * environment variable (.env). Ini adalah implementasi "real" dari poin
 * ".env config" pada daftar fitur: kredensial admin & JWT secret TIDAK
 * di-hardcode, melainkan diinjeksi lewat environment.
 */
require('dotenv').config();
const path = require('path');

function int(v, def) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? def : n;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  jwtSecret: process.env.JWT_SECRET || 'dev_swiftcase_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  bcryptRounds: int(process.env.BCRYPT_ROUNDS, 10),

  dbFile: process.env.DB_FILE || path.join(__dirname, '..', '..', 'data', 'swiftcase.db'),

  lowStockThreshold: int(process.env.LOW_STOCK_THRESHOLD, 5),
  ordersPerPage: int(process.env.ORDERS_PER_PAGE, 10),

  rateLimit: {
    windowMs: int(process.env.RATE_WINDOW_MS, 15 * 60 * 1000),
    max: int(process.env.RATE_MAX, 300),
    authWindowMs: int(process.env.AUTH_RATE_WINDOW_MS, 5 * 60 * 1000),
    authMax: int(process.env.AUTH_RATE_MAX, 5),
  },

  seed: {
    adminName: process.env.ADMIN_NAME || 'Administrator',
    adminUser: process.env.ADMIN_USERNAME || 'admin',
    adminPass: process.env.ADMIN_PASSWORD || 'admin123',
  },

  xendit: {
    secretKey: process.env.XENDIT_SECRET_KEY || '',
    callbackToken: process.env.XENDIT_CALLBACK_TOKEN || '',
    baseUrl: process.env.XENDIT_BASE_URL || 'https://api.xendit.co',
    // Bila tidak ada secret key → jalankan dalam mode MOCK (aman untuk dev lokal).
    get mock() { return !this.secretKey; },
  },
};

// Peringatan keamanan bila secret default dipakai di luar development.
if (config.env === 'production' && config.jwtSecret === 'dev_swiftcase_secret_change_me') {
  // eslint-disable-next-line no-console
  console.warn('⚠️  JWT_SECRET masih default! Set JWT_SECRET di .env untuk produksi.');
}

module.exports = config;
