'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const orderModel = require('../models/orderModel');
const customerModel = require('../models/customerModel');
const log = require('../models/logModel');
const sse = require('../utils/sse');
const config = require('../config');
const { toCSV } = require('../utils/csv');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');
const STATUSES = ['Baru', 'Diproses', 'Selesai', 'Batal'];

// POST /api/orders  (pelanggan / staff)
exports.create = asyncHandler(async (req, res) => {
  const {
    items, customer, customerId, orderType, payMethod, paymentStatus, paymentRef, notes,
    discountId, discountName, discountAmount,
  } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw ApiError.badRequest('Item pesanan kosong');

  const order = orderModel.create({
    items: items.map((i) => ({
      id: +i.id,
      qty: Math.max(1, parseInt(i.qty, 10) || 1),
      discountAmount: parseInt(i.discountAmount, 10) || 0,
      note: i.note,
    })),
    customer: customer || (req.user && req.user.name) || 'Tamu',
    customerId: customerId || null,
    userId: req.user && req.user.type === 'customer' ? req.user.id : null,
    orderType, payMethod, paymentStatus, paymentRef, notes,
    discountId: discountId || null,
    discountName: discountName || null,
    discountAmount: discountAmount || 0,
  });

  // Poin loyalti: 1 poin / Rp 10.000 (bila terhubung ke pelanggan)
  if (order.customerId) {
    const pts = Math.floor(order.total / 10000);
    if (pts > 0) customerModel.addPoints(order.customerId, pts);
  }

  log.add({ actor: actorOf(req), action: 'Pesanan baru', detail: `${order.queue} • ${order.total} • PPN ${Math.round((order.taxRate || 0) * 100)}%`, ip: req.ip });
  sse.broadcast('order:new', {
    id: order.id, queue: order.queue, customer: order.customer,
    total: order.total, status: order.status, newCount: orderModel.countNew(),
  });

  res.status(201).json(order);
});

// GET /api/orders?status=&q=&page=&limit=   (staff, dengan pagination)
exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || config.ordersPerPage);
  res.json(orderModel.list({ status: req.query.status, q: req.query.q, page, limit }));
});

// GET /api/orders/mine  (riwayat pesanan pelanggan yang login)
exports.myOrders = asyncHandler(async (req, res) => {
  res.json({ data: orderModel.listForUser(req.user.id) });
});

exports.get = asyncHandler(async (req, res) => {
  const o = orderModel.findById(+req.params.id);
  if (!o) throw ApiError.notFound('Pesanan tidak ditemukan');
  res.json(o);
});

// PATCH /api/orders/:id/status  (staff)
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) throw ApiError.badRequest('Status tidak valid');
  const o = orderModel.updateStatus(+req.params.id, status);
  if (!o) throw ApiError.notFound('Pesanan tidak ditemukan');
  log.add({ actor: actorOf(req), action: 'Update status pesanan', detail: `${o.queue} → ${status}`, ip: req.ip });
  sse.broadcast('order:update', { id: o.id, status: o.status, newCount: orderModel.countNew() });
  res.json(o);
});

// GET /api/orders/new-count  (untuk badge)
exports.newCount = asyncHandler(async (_req, res) => {
  res.json({ newCount: orderModel.countNew() });
});

// GET /api/orders/export.csv  (staff)
exports.exportCSV = asyncHandler(async (_req, res) => {
  const rows = [['Antrian', 'Pelanggan', 'Item', 'Subtotal', 'Diskon', 'PPN', 'Total', 'Status', 'Tipe', 'Pembayaran', 'Status Bayar', 'Catatan', 'Waktu']];
  orderModel.all().forEach((o) => rows.push([
    o.queue, o.customer,
    o.items.map((i) => `${i.name} x${i.qty}${i.note ? ` (${i.note})` : ''}`).join('; '),
    o.subtotal, (o.itemDiscount + o.discountAmount), o.taxAmount, o.total,
    o.status, o.orderType, o.payMethod, o.paymentStatus, o.notes, o.timestamp,
  ]));
  res.header('Content-Type', 'text/csv');
  res.attachment('pesanan.csv');
  res.send('﻿' + toCSV(rows));
});
