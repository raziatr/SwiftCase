'use strict';
const { db } = require('../db/database');

const map = (r) => (r ? {
  id: r.id,
  name: r.name,
  type: r.type,
  scope: r.scope || 'order',
  value: r.value,
  minOrder: r.min_order,
  expiresAt: r.expires_at,
  active: !!r.active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
} : null);

module.exports = {
  all({ includeInactive = false } = {}) {
    const sql = includeInactive
      ? 'SELECT * FROM discounts ORDER BY id'
      : 'SELECT * FROM discounts WHERE active=1 ORDER BY id';
    return db.prepare(sql).all().map(map);
  },

  findById(id) {
    return map(db.prepare('SELECT * FROM discounts WHERE id=?').get(id));
  },

  /** Diskon aktif yang berlaku untuk total tertentu (belum kadaluarsa). */
  eligible(total, scope) {
    const now = new Date().toISOString().slice(0, 10);
    let sql = `SELECT * FROM discounts
       WHERE active=1 AND min_order<=?
         AND (expires_at IS NULL OR expires_at >= ?)`;
    const params = [total, now];
    if (scope) { sql += ' AND scope=?'; params.push(scope); }
    sql += ' ORDER BY id';
    return db.prepare(sql).all(...params).map(map);
  },

  create({ name, type, scope = 'order', value, minOrder = 0, expiresAt = null }) {
    const info = db.prepare(
      `INSERT INTO discounts(name,type,scope,value,min_order,expires_at,active)
       VALUES(?,?,?,?,?,?,1)`
    ).run(name, type, scope, value, minOrder, expiresAt || null);
    return this.findById(info.lastInsertRowid);
  },

  update(id, { name, type, scope, value, minOrder, expiresAt }) {
    const cur = db.prepare('SELECT * FROM discounts WHERE id=?').get(id);
    if (!cur) return null;
    db.prepare(
      `UPDATE discounts SET name=?,type=?,scope=?,value=?,min_order=?,expires_at=?,
       updated_at=datetime('now') WHERE id=?`
    ).run(
      name != null ? name : cur.name,
      type != null ? type : cur.type,
      scope != null ? scope : cur.scope,
      value != null ? value : cur.value,
      minOrder != null ? minOrder : cur.min_order,
      expiresAt !== undefined ? (expiresAt || null) : cur.expires_at,
      id
    );
    return this.findById(id);
  },

  toggleActive(id) {
    const cur = db.prepare('SELECT active FROM discounts WHERE id=?').get(id);
    if (!cur) return null;
    db.prepare("UPDATE discounts SET active=?,updated_at=datetime('now') WHERE id=?")
      .run(cur.active ? 0 : 1, id);
    return this.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM discounts WHERE id=?').run(id).changes;
  },

  /** Hitung jumlah diskon dari sebuah basis nilai (total / harga item). */
  calcAmount(discount, base) {
    if (!discount) return 0;
    if (discount.type === 'percent') return Math.floor(base * discount.value / 100);
    return Math.min(discount.value, base);
  },
};
