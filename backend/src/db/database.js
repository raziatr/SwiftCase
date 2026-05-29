'use strict';
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

// Pastikan folder data ada
const dir = path.dirname(config.dbFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Memakai modul SQLite bawaan Node (node:sqlite, Node ≥ 22.5) —
// tanpa dependency native, jadi `npm install` selalu lancar.
const db = new DatabaseSync(config.dbFile);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

/** Jalankan migrasi skema (idempotent — CREATE TABLE IF NOT EXISTS). */
function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}

/**
 * Helper transaksi (node:sqlite belum punya db.transaction() seperti
 * better-sqlite3). Mengembalikan fungsi yang menjalankan fn dalam
 * BEGIN/COMMIT, dan ROLLBACK bila ada error.
 */
function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

module.exports = { db, migrate, transaction };
