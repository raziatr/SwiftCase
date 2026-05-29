'use strict';
const app = require('./app');
const config = require('./config');
const seed = require('./db/seed');

// Migrasi + seed otomatis saat boot (idempotent)
seed();

const server = app.listen(config.port, () => {
  /* eslint-disable no-console */
  console.log('\n  ╔══════════════════════════════════════════════╗');
  console.log('  ║          SwiftCase POS — Backend API          ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log(`  ▸ URL     : http://localhost:${config.port}`);
  console.log(`  ▸ Health  : http://localhost:${config.port}/health`);
  console.log(`  ▸ Env     : ${config.env}`);
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
  server.close(() => process.exit(0));
});

module.exports = server;
