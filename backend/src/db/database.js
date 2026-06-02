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

/** Tambah kolom bila belum ada (SQLite tak punya ADD COLUMN IF NOT EXISTS). */
function addColumnIfMissing(table, column, definition) {
  try {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN ${column} ${definition}`);
  } catch (_) { /* kolom sudah ada — abaikan */ }
}

/** Jalankan migrasi skema (idempotent — CREATE TABLE IF NOT EXISTS + ALTER). */
function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  // Migrasi kolom baru pada DB lama
  addColumnIfMissing('admins', 'active', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfMissing('products', 'purchase_price', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('products', 'sku', 'TEXT');
  addColumnIfMissing('products', 'barcode', 'TEXT');
  addColumnIfMissing('products', 'image_url', 'TEXT');
  addColumnIfMissing('orders', 'customer_id', 'INTEGER');
  addColumnIfMissing('orders', 'discount_id', 'INTEGER');
  addColumnIfMissing('orders', 'discount_name', 'TEXT');
  addColumnIfMissing('orders', 'item_discount', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('orders', 'discount_amount', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('orders', 'subtotal', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('orders', 'tax_rate', 'REAL NOT NULL DEFAULT 0');
  addColumnIfMissing('orders', 'tax_amount', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('orders', 'raw_total', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('order_items', 'discount_amount', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('discounts', 'scope', "TEXT NOT NULL DEFAULT 'order'");
  addColumnIfMissing('activity_logs', 'before_value', 'TEXT');
  addColumnIfMissing('activity_logs', 'after_value', 'TEXT');
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
