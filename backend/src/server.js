'use strict';
const fs = require('fs');
const http = require('http');
const https = require('https');
const config = require('./config');
const seed = require('./db/seed');
const app = require('./app');
const backupService = require('./services/backupService');

// Migrasi + seed otomatis saat boot (idempotent)
seed();

// Tentukan protokol: HTTPS bila sertifikat tersedia, jika tidak HTTP.
let server;
let protocol = 'http';
if (config.ssl.enabled) {
  try {
    server = https.createServer({
      key: fs.readFileSync(config.ssl.keyFile),
      cert: fs.readFileSync(config.ssl.certFile),
      minVersion: 'TLSv1.2',
    }, app);
    protocol = 'https';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`⚠ Gagal memuat sertifikat SSL (${e.message}). Fallback ke HTTP.`);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

server.listen(config.port, () => {
  backupService.startScheduler();
  /* eslint-disable no-console */
  console.log('\n  ╔══════════════════════════════════════════════╗');
  console.log('  ║          SwiftCase POS — Backend API          ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log(`  ▸ URL     : ${protocol}://localhost:${config.port}`);
  console.log(`  ▸ Health  : ${protocol}://localhost:${config.port}/health`);
  console.log(`  ▸ Env     : ${config.env}`);
  console.log(`  ▸ TLS     : ${protocol === 'https' ? 'AKTIF (HTTPS)' : 'nonaktif (HTTP) — set SSL_KEY_FILE & SSL_CERT_FILE'}`);
  console.log(`  ▸ Backup  : ${config.backup.enabled ? `otomatis tiap ${config.backup.intervalHours} jam (simpan ${config.backup.keep})` : 'nonaktif'}`);
  console.log(`  ▸ PPN     : ${Math.round(config.taxRate * 100)}%`);
  console.log(`  ▸ Xendit  : ${config.xendit.mock ? 'MOCK (set XENDIT_SECRET_KEY untuk live)' : 'LIVE'}`);
  console.log('');
  /* eslint-enable no-console */
});

// Penanganan error proses (jangan crash diam-diam)
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('UncaughtException:', err);
});
process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('\n👋 Menutup server...');
  backupService.stopScheduler();
  server.close(() => process.exit(0));
});

module.exports = server;
