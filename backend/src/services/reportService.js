'use strict';
const { db } = require('../db/database');

/** Bangun WHERE + params dari opts: { range:'7'|'30'|'all'|'custom', from, to } */
function buildWhere(opts = {}) {
  const { range, from, to } = opts;
  const clauses = ["o.status != 'Batal'"];
  const params = [];
  if (from) { clauses.push('date(o.created_at) >= date(?)'); params.push(from); }
  if (to) { clauses.push('date(o.created_at) <= date(?)'); params.push(to); }
  if (!from && !to && range !== 'all') {
    const days = range === '7' ? 6 : 29;
    clauses.push(`date(o.created_at) >= date('now','-${days} day')`);
  }
  return { where: clauses.join(' AND '), params };
}

module.exports = {
  // Penjualan per produk (qty & pendapatan), terlaris dulu.
  perProduct(opts = {}) {
    const { where, params } = buildWhere(opts);
    const rows = db.prepare(`
      SELECT oi.product_id AS id, oi.name AS name,
             SUM(oi.qty) AS qty, SUM(oi.qty * oi.price) AS revenue
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE ${where}
      GROUP BY oi.product_id, oi.name
      ORDER BY qty DESC
    `).all(...params);
    const prods = db.prepare('SELECT id, category, emoji FROM products').all();
    const pmap = Object.fromEntries(prods.map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      category: pmap[r.id] ? pmap[r.id].category : '-',
      emoji: pmap[r.id] ? pmap[r.id].emoji : '🍽️',
    }));
  },

  // Ringkasan total dengan subtotal, diskon, PPN, pendapatan.
  summary(opts = {}) {
    const { where, params } = buildWhere(opts);
    const orderAgg = db.prepare(`
      SELECT COUNT(*) AS orders,
             COALESCE(SUM(total), 0)      AS revenue,
             COALESCE(SUM(subtotal), 0)   AS subtotal,
             COALESCE(SUM(tax_amount), 0) AS taxTotal,
             COALESCE(SUM(item_discount + discount_amount), 0) AS discountTotal
      FROM orders o WHERE ${where}
    `).get(...params);
    const itemAgg = db.prepare(`
      SELECT COALESCE(SUM(oi.qty), 0) AS items
      FROM orders o JOIN order_items oi ON o.id = oi.order_id
      WHERE ${where}
    `).get(...params);
    return {
      orders: orderAgg.orders,
      items: itemAgg.items,
      revenue: orderAgg.revenue,
      subtotal: orderAgg.subtotal,
      taxTotal: orderAgg.taxTotal,
      discountTotal: orderAgg.discountTotal,
      rawRevenue: orderAgg.subtotal,
    };
  },

  // Tren pendapatan harian.
  trend(opts = {}) {
    const { where, params } = buildWhere(opts);
    return db.prepare(`
      SELECT date(o.created_at) AS day, SUM(o.total) AS total, COUNT(o.id) AS orders
      FROM orders o WHERE ${where}
      GROUP BY date(o.created_at) ORDER BY day
    `).all(...params);
  },

  // Breakdown per metode pembayaran.
  perPayMethod(opts = {}) {
    const { where, params } = buildWhere(opts);
    return db.prepare(`
      SELECT pay_method AS method, COUNT(*) AS orders, SUM(total) AS revenue
      FROM orders o WHERE ${where}
      GROUP BY pay_method ORDER BY revenue DESC
    `).all(...params);
  },

  // Semua pesanan dalam rentang (untuk export detail).
  rawOrders(opts = {}) {
    const { where, params } = buildWhere(opts);
    return db.prepare(`
      SELECT o.*, GROUP_CONCAT(oi.name || ' x' || oi.qty, '; ') AS items_summary
      FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${where}
      GROUP BY o.id ORDER BY datetime(o.created_at) DESC
    `).all(...params);
  },
};
