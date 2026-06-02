'use strict';
const { db } = require('../db/database');

const map = (r) => (r ? {
  id: r.id,
  name: r.name,
  category: r.category,
  price: r.price,
  purchasePrice: r.purchase_price || 0,
  stock: r.stock,
  sku: r.sku || null,
  barcode: r.barcode || null,
  desc: r.description,
  emoji: r.emoji,
  imageUrl: r.image_url || null,
  active: !!r.active,
} : null);

module.exports = {
  all({ includeInactive = false } = {}) {
    const sql = includeInactive
      ? 'SELECT * FROM products ORDER BY id'
      : 'SELECT * FROM products WHERE active=1 ORDER BY id';
    return db.prepare(sql).all().map(map);
  },

  findById(id) { return map(db.prepare('SELECT * FROM products WHERE id=?').get(id)); },

  findByBarcode(code) {
    return map(db.prepare('SELECT * FROM products WHERE (barcode=? OR sku=?) AND active=1').get(code, code));
  },

  raw(id) { return db.prepare('SELECT * FROM products WHERE id=?').get(id); },

  create({ name, category, price, purchasePrice = 0, stock, sku, barcode, desc, emoji, imageUrl }) {
    const info = db.prepare(
      `INSERT INTO products(name,category,price,purchase_price,stock,sku,barcode,description,emoji,image_url)
       VALUES(?,?,?,?,?,?,?,?,?,?)`
    ).run(name, category, price, purchasePrice, stock, sku || null, barcode || null, desc || '', emoji || '🍽️', imageUrl || null);
    return this.findById(info.lastInsertRowid);
  },

  update(id, d) {
    const cur = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!cur) return null;
    db.prepare(
      `UPDATE products SET name=?,category=?,price=?,purchase_price=?,stock=?,sku=?,barcode=?,
       description=?,emoji=?,image_url=?,updated_at=datetime('now') WHERE id=?`
    ).run(
      d.name != null ? d.name : cur.name,
      d.category != null ? d.category : cur.category,
      d.price != null ? d.price : cur.price,
      d.purchasePrice != null ? d.purchasePrice : cur.purchase_price,
      d.stock != null ? d.stock : cur.stock,
      d.sku !== undefined ? (d.sku || null) : cur.sku,
      d.barcode !== undefined ? (d.barcode || null) : cur.barcode,
      d.desc != null ? d.desc : cur.description,
      d.emoji != null ? d.emoji : cur.emoji,
      d.imageUrl !== undefined ? (d.imageUrl || null) : cur.image_url,
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
