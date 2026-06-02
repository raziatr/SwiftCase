'use strict';
/**
 * Membuat sertifikat TLS self-signed untuk pengembangan lokal.
 * Hasil: certs/key.pem & certs/cert.pem
 *
 * Jalankan: `npm run gen-cert`
 * Lalu set di .env:
 *   SSL_KEY_FILE=./certs/key.pem
 *   SSL_CERT_FILE=./certs/cert.pem
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const keyFile = path.join(dir, 'key.pem');
const certFile = path.join(dir, 'cert.pem');

try {
  execSync(
    `openssl req -x509 -newkey rsa:2048 -nodes -sha256 ` +
    `-keyout "${keyFile}" -out "${certFile}" -days 365 ` +
    `-subj "/C=ID/ST=Dev/L=Local/O=SwiftCase/CN=localhost"`,
    { stdio: 'inherit' }
  );
  // eslint-disable-next-line no-console
  console.log(`
✓ Sertifikat self-signed dibuat:
  - ${keyFile}
  - ${certFile}

Tambahkan ke .env untuk mengaktifkan HTTPS:
  SSL_KEY_FILE=./certs/key.pem
  SSL_CERT_FILE=./certs/cert.pem

Lalu jalankan: npm run dev
Buka: https://localhost:4000  (browser akan minta konfirmasi sertifikat self-signed)
`);
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Gagal membuat sertifikat. Pastikan OpenSSL terpasang.', e.message);
  process.exit(1);
}
