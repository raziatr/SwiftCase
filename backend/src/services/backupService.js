'use strict';
const fs = require('fs');
const path = require('path');
const config = require('../config');

function ensureDir() {
  if (!fs.existsSync(config.backup.dir)) {
    fs.mkdirSync(config.backup.dir, { recursive: true });
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** Lakukan satu kali backup file DB (beserta -wal/-shm bila ada). Return info file. */
function runBackup() {
  ensureDir();
  const src = config.dbFile;
  if (!fs.existsSync(src)) throw new Error('File database tidak ditemukan: ' + src);

  const name = `swiftcase-${timestamp()}.db`;
  const dest = path.join(config.backup.dir, name);

  // Checkpoint WAL agar isi terbaru ikut ter-backup, lalu salin file.
  try {
    const { db } = require('../db/database');
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  } catch (_) { /* abaikan bila gagal checkpoint */ }

  fs.copyFileSync(src, dest);
  rotate();

  const { size } = fs.statSync(dest);
  return { file: name, path: dest, size, createdAt: new Date().toISOString() };
}

/** Hapus backup lama, sisakan `config.backup.keep` terbaru. */
function rotate() {
  const files = listBackups();
  const excess = files.slice(config.backup.keep);
  excess.forEach((f) => {
    try { fs.unlinkSync(path.join(config.backup.dir, f.file)); } catch (_) { /* noop */ }
  });
}

/** Daftar backup, terbaru lebih dulu. */
function listBackups() {
  ensureDir();
  return fs.readdirSync(config.backup.dir)
    .filter((f) => f.endsWith('.db'))
    .map((f) => {
      const st = fs.statSync(path.join(config.backup.dir, f));
      return { file: f, size: st.size, createdAt: st.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

let timer = null;
/** Jadwalkan backup otomatis sesuai interval di config. */
function startScheduler() {
  if (!config.backup.enabled) return;
  const intervalMs = config.backup.intervalHours * 60 * 60 * 1000;

  // Backup awal saat startup (sekali), lalu berkala.
  try {
    const info = runBackup();
    // eslint-disable-next-line no-console
    console.log(`   ✓ Backup awal: ${info.file} (${(info.size / 1024).toFixed(1)} KB)`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('   ⚠ Backup awal gagal:', e.message);
  }

  timer = setInterval(() => {
    try {
      const info = runBackup();
      // eslint-disable-next-line no-console
      console.log(`[backup] otomatis dibuat: ${info.file}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[backup] gagal:', e.message);
    }
  }, intervalMs);
  if (timer.unref) timer.unref();
}

function stopScheduler() {
  if (timer) { clearInterval(timer); timer = null; }
}

module.exports = { runBackup, listBackups, startScheduler, stopScheduler };

// Jalankan manual: `npm run backup`
if (require.main === module) {
  const info = runBackup();
  // eslint-disable-next-line no-console
  console.log('Backup dibuat:', info.path);
  process.exit(0);
}
