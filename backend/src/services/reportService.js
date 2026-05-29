'use strict';
const { db } = require('../db/database');

// Klausa rentang waktu berbasis kolom orders.created_at (alias o).
function rangeClause(range) {
  if (range === '7') return "AND date(o.created_at) >= date('now','-6 day')";
  if (range === '30') return "AND date(o.created_at) >= date('now','-29 day')";
  return '';
}

module.exports = {
  // Penjualan per produk (qty & pendapatan), diurutkan terlaris.
  perProduct(range) {
    const rows = db.prepare(`
      SELECT oi.product_id AS id, oi.name AS name,
             SUM(oi.qty) AS qty, SUM(oi.qty * oi.price) AS revenue
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'Batal' ${rangeClause(range)}
      GROUP BY oi.product_id, oi.name
      ORDER BY qty DESC
    `).all();
    const prods = db.prepare('SELECT id, category, emoji FROM products').all();
    const pmap = Object.fromEntries(prods.map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      category: pmap[r.id] ? pmap[r.id].category : '-',
      emoji: pmap[r.id] ? pmap[r.id].emoji : '🍽️',
    }));
  },

  // Ringkasan total (pesanan, item, pendapatan).
  summary(range) {
    const r = db.prepare(`
      SELECT COUNT(DISTINCT o.id) AS orders,
             COALESCE(SUM(oi.qty), 0) AS items,
             COALESCE(SUM(oi.qty * oi.price), 0) AS revenue
      FROM orders o JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status != 'Batal' ${rangeClause(range)}
    `).get();
    return r;
  },

  // Tren pendapatan harian.
  trend(range) {
    return db.prepare(`
      SELECT date(o.created_at) AS day, SUM(o.total) AS total
      FROM orders o
      WHERE o.status != 'Batal' ${rangeClause(range)}
      GROUP BY date(o.created_at)
      ORDER BY day
    `).all();
  },
};
