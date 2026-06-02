'use strict';
const { db, transaction } = require('../db/database');
const productModel = require('./productModel');
const ApiError = require('../utils/ApiError');
const config = require('../config');

function getItems(orderId) {
  return db.prepare(
    'SELECT product_id AS id, name, price, qty, discount_amount AS discountAmount, note FROM order_items WHERE order_id=?'
  ).all(orderId);
}

function hydrate(o) {
  if (!o) return null;
  return {
    id: o.id,
    queue: o.queue_no,
    userId: o.user_id,
    customerId: o.customer_id || null,
    customer: o.customer_name,
    orderType: o.order_type,
    payMethod: o.pay_method,
    paymentStatus: o.payment_status,
    paymentRef: o.payment_ref,
    status: o.status,
    notes: o.notes,
    discountId: o.discount_id || null,
    discountName: o.discount_name || '',
    itemDiscount: o.item_discount || 0,
    discountAmount: o.discount_amount || 0,
    subtotal: o.subtotal || o.raw_total || 0,
    taxRate: o.tax_rate || 0,
    taxAmount: o.tax_amount || 0,
    rawTotal: o.raw_total || o.total,
    total: o.total,
    timestamp: o.created_at,
    items: getItems(o.id),
  };
}

// Nomor antrian harian: A001, A002, ... (reset tiap hari)
function nextQueue() {
  const row = db.prepare("SELECT COUNT(*) c FROM orders WHERE date(created_at)=date('now')").get();
  return 'A' + String(row.c + 1).padStart(3, '0');
}

// Transaksional: validasi stok → diskon item → diskon total → PPN → simpan → kurangi stok.
const createTx = transaction((data) => {
  let subtotal = 0;
  let itemDiscountTotal = 0;

  const items = data.items.map((it) => {
    const p = productModel.raw(it.id);
    if (!p || !p.active) throw ApiError.badRequest('Produk tidak tersedia (id ' + it.id + ')');
    if (p.stock < it.qty) throw ApiError.conflict(`Stok tidak cukup untuk ${p.name} (sisa ${p.stock})`);
    const lineTotal = p.price * it.qty;
    const lineDiscount = Math.max(0, Math.min(parseInt(it.discountAmount, 10) || 0, lineTotal));
    subtotal += lineTotal;
    itemDiscountTotal += lineDiscount;
    return { id: p.id, name: p.name, price: p.price, qty: it.qty, discountAmount: lineDiscount, note: (it.note || '').trim() };
  });

  const afterItem = subtotal - itemDiscountTotal;
  const orderDiscount = Math.max(0, Math.min(parseInt(data.discountAmount, 10) || 0, afterItem));
  const taxBase = afterItem - orderDiscount;
  const taxRate = config.taxRate || 0;
  const taxAmount = Math.round(taxBase * taxRate);
  const total = taxBase + taxAmount;

  const queue = nextQueue();
  const info = db.prepare(
    `INSERT INTO orders(queue_no,user_id,customer_id,customer_name,order_type,pay_method,payment_status,
      payment_ref,status,notes,discount_id,discount_name,item_discount,discount_amount,
      subtotal,tax_rate,tax_amount,raw_total,total)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    queue, data.userId || null, data.customerId || null, data.customer,
    data.orderType || 'Dine-in', data.payMethod || 'Tunai',
    data.paymentStatus || 'Belum Bayar', data.paymentRef || null,
    'Baru', data.notes || '',
    data.discountId || null, data.discountName || null,
    itemDiscountTotal, orderDiscount,
    subtotal, taxRate, taxAmount, subtotal, total
  );

  const orderId = info.lastInsertRowid;
  const insItem = db.prepare(
    'INSERT INTO order_items(order_id,product_id,name,price,qty,discount_amount,note) VALUES(?,?,?,?,?,?,?)'
  );
  const decStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  for (const it of items) {
    insItem.run(orderId, it.id, it.name, it.price, it.qty, it.discountAmount, it.note);
    decStock.run(it.qty, it.id);
  }
  return orderId;
});

module.exports = {
  create(data) {
    const id = createTx(data);
    return hydrate(db.prepare('SELECT * FROM orders WHERE id=?').get(id));
  },
  findById(id) { return hydrate(db.prepare('SELECT * FROM orders WHERE id=?').get(id)); },
  list({ status, q, page = 1, limit = 10 }) {
    const where = []; const params = [];
    if (status && status !== 'Semua') { where.push('status = ?'); params.push(status); }
    if (q) { where.push('(customer_name LIKE ? OR queue_no LIKE ?)'); params.push('%' + q + '%', '%' + q + '%'); }
    const wsql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) c FROM orders ${wsql}`).get(...params).c;
    const offset = (page - 1) * limit;
    const rows = db.prepare(`SELECT * FROM orders ${wsql} ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);
    return { data: rows.map(hydrate), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
  },
  listForUser(userId) {
    return db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY datetime(created_at) DESC').all(userId).map(hydrate);
  },
  all() {
    return db.prepare('SELECT * FROM orders ORDER BY datetime(created_at) DESC').all().map(hydrate);
  },
  updateStatus(id, status) {
    const c = db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, id).changes;
    return c ? this.findById(id) : null;
  },
  markPaid(id, ref) {
    const c = db.prepare("UPDATE orders SET payment_status='Lunas', payment_ref=? WHERE id=?").run(ref || null, id).changes;
    return c ? this.findById(id) : null;
  },
  countNew() {
    return db.prepare("SELECT COUNT(*) c FROM orders WHERE status='Baru'").get().c;
  },
};
