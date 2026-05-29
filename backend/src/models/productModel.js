'use strict';
const { db } = require('../db/database');

// Map baris DB → bentuk yang dipakai frontend (desc, bukan description).
const map = (r) => (r ? {
  id: r.id, name: r.name, category: r.category, price: r.price,
  stock: r.stock, desc: r.description, emoji: r.emoji, active: !!r.active,
} : null);

module.exports = {
  all({ includeInactive = false } = {}) {
    const sql = includeInactive
      ? 'SELECT * FROM products ORDER BY id'
      : 'SELECT * FROM products WHERE active=1 ORDER BY id';
    return db.prepare(sql).all().map(map);
  },
  findById(id) { return map(db.prepare('SELECT * FROM products WHERE id=?').get(id)); },
  raw(id) { return db.prepare('SELECT * FROM products WHERE id=?').get(id); },
  create({ name, category, price, stock, desc, emoji }) {
    const info = db.prepare(
      'INSERT INTO products(name,category,price,stock,description,emoji) VALUES(?,?,?,?,?,?)'
    ).run(name, category, price, stock, desc || '', emoji || '🍽️');
    return this.findById(info.lastInsertRowid);
  },
  update(id, d) {
    const cur = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!cur) return null;
    db.prepare(
      "UPDATE products SET name=?,category=?,price=?,stock=?,description=?,emoji=?,updated_at=datetime('now') WHERE id=?"
    ).run(
      d.name != null ? d.name : cur.name,
      d.category != null ? d.category : cur.category,
      d.price != null ? d.price : cur.price,
      d.stock != null ? d.stock : cur.stock,
      d.desc != null ? d.desc : cur.description,
      d.emoji != null ? d.emoji : cur.emoji,
      id
    );
    return this.findById(id);
  },
  setStock(id, stock) {
    const c = db.prepare("UPDATE products SET stock=?, updated_at=datetime('now') WHERE id=?")
      .run(Math.max(0, stock), id).changes;
    return c ? this.findById(id) : null;
  },
  remove(id) { return db.prepare('DELETE FROM products WHERE id=?').run(id).changes; },
  lowStock(threshold) {
    return db.prepare('SELECT * FROM products WHERE active=1 AND stock < ? ORDER BY stock').all(threshold).map(map);
  },
};
