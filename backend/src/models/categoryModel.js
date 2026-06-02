'use strict';
const { db } = require('../db/database');

const map = (r) => (r ? { id: r.id, name: r.name, sortOrder: r.sort_order, createdAt: r.created_at } : null);

module.exports = {
  all() {
    return db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all().map(map);
  },

  findById(id) {
    return map(db.prepare('SELECT * FROM categories WHERE id=?').get(id));
  },

  findByName(name) {
    return map(db.prepare('SELECT * FROM categories WHERE name=?').get(name));
  },

  create({ name, sortOrder = 0 }) {
    const info = db.prepare('INSERT INTO categories(name,sort_order) VALUES(?,?)').run(name, sortOrder);
    return this.findById(info.lastInsertRowid);
  },

  update(id, { name, sortOrder }) {
    const cur = db.prepare('SELECT * FROM categories WHERE id=?').get(id);
    if (!cur) return null;
    db.prepare('UPDATE categories SET name=?,sort_order=? WHERE id=?').run(
      name != null ? name : cur.name,
      sortOrder != null ? sortOrder : cur.sort_order,
      id
    );
    return this.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM categories WHERE id=?').run(id).changes;
  },

  isUsedByProducts(name) {
    return db.prepare('SELECT 1 FROM products WHERE category=? AND active=1 LIMIT 1').get(name) != null;
  },
};
