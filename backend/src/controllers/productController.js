'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const productModel = require('../models/productModel');
const stockMovementModel = require('../models/stockMovementModel');
const log = require('../models/logModel');
const config = require('../config');
const { toCSV } = require('../utils/csv');
const { sendXLSX } = require('../utils/xlsx');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');

// GET /api/products  (?all=1 admin lihat nonaktif, ?category=, ?search=)
exports.list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === '1' && req.user && req.user.type === 'admin';
  let products = productModel.all({ includeInactive });
  if (req.query.category) products = products.filter((p) => p.category === req.query.category);
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    products = products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.desc || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q));
  }
  res.json({ data: products });
});

// GET /api/products/barcode/:code  — cari via barcode/SKU (scan kasir)
exports.byBarcode = asyncHandler(async (req, res) => {
  const p = productModel.findByBarcode(req.params.code);
  if (!p) throw ApiError.notFound('Produk dengan barcode/SKU tersebut tidak ditemukan');
  res.json(p);
});

exports.get = asyncHandler(async (req, res) => {
  const p = productModel.findById(+req.params.id);
  if (!p) throw ApiError.notFound('Produk tidak ditemukan');
  res.json(p);
});

// POST /api/products/upload  — unggah foto (multipart field "image")
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('File gambar tidak ditemukan (field "image")');
  const url = '/uploads/' + req.file.filename;
  log.add({ actor: actorOf(req), action: 'Upload foto produk', detail: req.file.filename, ip: req.ip });
  res.status(201).json({ url, filename: req.file.filename });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, category, price, purchasePrice, stock, sku, barcode, desc, emoji, imageUrl } = req.body;
  if (!name) throw ApiError.badRequest('Nama produk wajib diisi');
  if (price == null || isNaN(price) || price < 0) throw ApiError.badRequest('Harga tidak valid');
  const stockVal = Math.max(0, parseInt(stock, 10) || 0);
  const p = productModel.create({
    name, category: category || 'Lainnya', price: Math.round(price),
    purchasePrice: Math.round(purchasePrice || 0), stock: stockVal,
    sku: sku || null, barcode: barcode || null, desc: desc || '', emoji: emoji || '🍽️',
    imageUrl: imageUrl || null,
  });
  if (stockVal > 0) {
    stockMovementModel.record({
      productId: p.id, productName: p.name, delta: stockVal,
      reason: 'Stok awal', stockBefore: 0, stockAfter: stockVal, actor: actorOf(req),
    });
  }
  log.add({ actor: actorOf(req), action: 'Tambah produk', detail: name, ip: req.ip });
  res.status(201).json(p);
});

exports.update = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = productModel.findById(id);
  if (!cur) throw ApiError.notFound('Produk tidak ditemukan');
  const { name, category, price, purchasePrice, stock, sku, barcode, desc, emoji, imageUrl } = req.body;
  if (price != null && (isNaN(price) || price < 0)) throw ApiError.badRequest('Harga tidak valid');
  const newStock = stock != null ? Math.max(0, parseInt(stock, 10) || 0) : undefined;
  const p = productModel.update(id, {
    name, category, emoji, desc,
    price: price != null ? Math.round(price) : undefined,
    purchasePrice: purchasePrice != null ? Math.round(purchasePrice) : undefined,
    stock: newStock,
    sku: sku !== undefined ? sku : undefined,
    barcode: barcode !== undefined ? barcode : undefined,
    imageUrl: imageUrl !== undefined ? imageUrl : undefined,
  });
  if (newStock !== undefined && newStock !== cur.stock) {
    stockMovementModel.record({
      productId: id, productName: p.name, delta: newStock - cur.stock,
      reason: 'Edit produk', stockBefore: cur.stock, stockAfter: newStock, actor: actorOf(req),
    });
  }
  log.add({
    actor: actorOf(req), action: 'Edit produk', detail: p.name, ip: req.ip,
    before: { name: cur.name, category: cur.category, price: cur.price, purchasePrice: cur.purchasePrice, stock: cur.stock, sku: cur.sku },
    after: { name: p.name, category: p.category, price: p.price, purchasePrice: p.purchasePrice, stock: p.stock, sku: p.sku },
  });
  res.json(p);
});

// PATCH /api/products/:id/stock  body: { delta|stock, reason }
exports.adjustStock = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = productModel.findById(id);
  if (!cur) throw ApiError.notFound('Produk tidak ditemukan');
  let next;
  if (req.body.stock != null) next = Math.max(0, parseInt(req.body.stock, 10) || 0);
  else if (req.body.delta != null) next = Math.max(0, cur.stock + parseInt(req.body.delta, 10));
  else throw ApiError.badRequest('Sertakan "stock" atau "delta"');
  const reason = (req.body.reason || 'Manual').trim();
  const p = productModel.setStock(id, next);
  stockMovementModel.record({
    productId: id, productName: p.name, delta: next - cur.stock,
    reason, stockBefore: cur.stock, stockAfter: next, actor: actorOf(req),
  });
  log.add({ actor: actorOf(req), action: 'Ubah stok', detail: `${p.name}: ${cur.stock}→${next} (${reason})`, ip: req.ip });
  res.json(p);
});

exports.remove = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const p = productModel.findById(id);
  if (!p) throw ApiError.notFound('Produk tidak ditemukan');
  productModel.remove(id);
  log.add({ actor: actorOf(req), action: 'Hapus produk', detail: p.name, ip: req.ip });
  res.json({ deleted: true, id });
});

exports.lowStock = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold, 10) || config.lowStockThreshold;
  res.json({ threshold, data: productModel.lowStock(threshold) });
});

exports.exportCSV = asyncHandler(async (_req, res) => {
  const rows = [['ID', 'Produk', 'SKU', 'Barcode', 'Kategori', 'Harga Jual', 'Harga Beli', 'Stok', 'Aktif']];
  productModel.all({ includeInactive: true }).forEach((p) =>
    rows.push([p.id, p.name, p.sku || '', p.barcode || '', p.category, p.price, p.purchasePrice, p.stock, p.active ? 'ya' : 'tidak']));
  res.header('Content-Type', 'text/csv');
  res.attachment('produk.csv');
  res.send('﻿' + toCSV(rows));
});

exports.exportXLSX = asyncHandler(async (_req, res) => {
  const header = ['ID', 'Produk', 'SKU', 'Barcode', 'Kategori', 'Harga Jual', 'Harga Beli', 'Stok', 'Aktif'];
  const rows = [header, ...productModel.all({ includeInactive: true }).map((p) =>
    [p.id, p.name, p.sku || '', p.barcode || '', p.category, p.price, p.purchasePrice, p.stock, p.active ? 'ya' : 'tidak'])];
  sendXLSX(res, 'produk.xlsx', [{ name: 'Produk', rows }]);
});
