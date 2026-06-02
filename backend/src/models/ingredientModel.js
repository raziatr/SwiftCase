'use strict';
const { db } = require('../db/database');

const map = (r) => (r ? {
  id: r.id,
  name: r.name,
  unit: r.unit,
  qty: r.qty,
  minStock: r.min_stock,
  low: r.qty <= r.min_stock,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
} : null);

module.exports = {
  all() {
    return db.prepare('SELECT * FROM ingredients ORDER BY name').all().map(map);
  },

  findById(id) {
    return map(db.prepare('SELECT * FROM ingredients WHERE id=?').get(id));
  },

  raw(id) {
    return db.prepare('SELECT * FROM ingredients WHERE id=?').get(id);
  },

  create({ name, unit, qty = 0, minStock = 0 }) {
    const info = db.prepare(
      'INSERT INTO ingredients(name,unit,qty,min_stock) VALUES(?,?,?,?)'
    ).run(name, unit || 'pcs', qty, minStock);
    return this.findById(info.lastInsertRowid);
  },

  update(id, d) {
    const cur = db.prepare('SELECT * FROM ingredients WHERE id=?').get(id);
    if (!cur) return null;
    db.prepare(
      "UPDATE ingredients SET name=?,unit=?,qty=?,min_stock=?,updated_at=datetime('now') WHERE id=?"
    ).run(
      d.name != null ? d.name : cur.name,
      d.unit != null ? d.unit : cur.unit,
      d.qty != null ? d.qty : cur.qty,
      d.minStock != null ? d.minStock : cur.min_stock,
      id
    );
    return this.findById(id);
  },

  /** Setel qty langsung (untuk penyesuaian stok bahan). */
  setQty(id, qty) {
    const c = db.prepare("UPDATE ingredients SET qty=?,updated_at=datetime('now') WHERE id=?")
      .run(Math.max(0, qty), id).changes;
    return c ? this.findById(id) : null;
  },

  remove(id) {
    return db.prepare('DELETE FROM ingredients WHERE id=?').run(id).changes;
  },

  /** Bahan baku di bawah / sama dengan min_stock (perlu restok). */
  lowStock() {
    return db.prepare('SELECT * FROM ingredients WHERE qty <= min_stock ORDER BY qty').all().map(map);
  },
};
