'use strict';
const { db } = require('../db/database');

const map = (r) => (r ? {
  id: r.id,
  name: r.name,
  phone: r.phone || '',
  email: r.email || '',
  address: r.address || '',
  points: r.points || 0,
  note: r.note || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
} : null);

module.exports = {
  all({ search } = {}) {
    if (search) {
      const q = `%${search}%`;
      return db.prepare(
        'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY name'
      ).all(q, q, q).map(map);
    }
    return db.prepare('SELECT * FROM customers ORDER BY name').all().map(map);
  },

  findById(id) {
    return map(db.prepare('SELECT * FROM customers WHERE id=?').get(id));
  },

  findByPhone(phone) {
    return map(db.prepare('SELECT * FROM customers WHERE phone=?').get(phone));
  },

  create({ name, phone, email, address, note }) {
    const info = db.prepare(
      'INSERT INTO customers(name,phone,email,address,note) VALUES(?,?,?,?,?)'
    ).run(name, phone || null, email || null, address || null, note || null);
    return this.findById(info.lastInsertRowid);
  },

  update(id, d) {
    const cur = db.prepare('SELECT * FROM customers WHERE id=?').get(id);
    if (!cur) return null;
    db.prepare(
      "UPDATE customers SET name=?,phone=?,email=?,address=?,note=?,updated_at=datetime('now') WHERE id=?"
    ).run(
      d.name != null ? d.name : cur.name,
      d.phone !== undefined ? (d.phone || null) : cur.phone,
      d.email !== undefined ? (d.email || null) : cur.email,
      d.address !== undefined ? (d.address || null) : cur.address,
      d.note !== undefined ? (d.note || null) : cur.note,
      id
    );
    return this.findById(id);
  },

  /** Tambah poin loyalti (mis. dari transaksi). */
  addPoints(id, pts) {
    const c = db.prepare("UPDATE customers SET points=points+?,updated_at=datetime('now') WHERE id=?")
      .run(pts, id).changes;
    return c ? this.findById(id) : null;
  },

  remove(id) {
    return db.prepare('DELETE FROM customers WHERE id=?').run(id).changes;
  },

  count() {
    return db.prepare('SELECT COUNT(*) c FROM customers').get().c;
  },
};
