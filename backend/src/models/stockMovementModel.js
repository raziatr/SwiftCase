'use strict';
const { db } = require('../db/database');

const map = (r) => (r ? {
  id: r.id,
  productId: r.product_id,
  productName: r.product_name,
  delta: r.delta,
  reason: r.reason,
  stockBefore: r.stock_before,
  stockAfter: r.stock_after,
  actor: r.actor,
  createdAt: r.created_at,
} : null);

module.exports = {
  record({ productId, productName, delta, reason, stockBefore, stockAfter, actor }) {
    const info = db.prepare(
      `INSERT INTO stock_movements
        (product_id,product_name,delta,reason,stock_before,stock_after,actor)
       VALUES(?,?,?,?,?,?,?)`
    ).run(productId || null, productName, delta, reason || 'Manual', stockBefore, stockAfter, actor || 'system');
    return map(db.prepare('SELECT * FROM stock_movements WHERE id=?').get(info.lastInsertRowid));
  },

  list({ productId, limit = 200, offset = 0 } = {}) {
    if (productId) {
      return db.prepare(
        'SELECT * FROM stock_movements WHERE product_id=? ORDER BY id DESC LIMIT ? OFFSET ?'
      ).all(productId, limit, offset).map(map);
    }
    return db.prepare(
      'SELECT * FROM stock_movements ORDER BY id DESC LIMIT ? OFFSET ?'
    ).all(limit, offset).map(map);
  },

  count({ productId } = {}) {
    if (productId) {
      return db.prepare('SELECT COUNT(*) c FROM stock_movements WHERE product_id=?').get(productId).c;
    }
    return db.prepare('SELECT COUNT(*) c FROM stock_movements').get().c;
  },

  all({ productId } = {}) {
    if (productId) {
      return db.prepare('SELECT * FROM stock_movements WHERE product_id=? ORDER BY id DESC').all(productId).map(map);
    }
    return db.prepare('SELECT * FROM stock_movements ORDER BY id DESC').all().map(map);
  },
};
