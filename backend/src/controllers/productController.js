'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const productModel = require('../models/productModel');
const log = require('../models/logModel');
const config = require('../config');
const { toCSV } = require('../utils/csv');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');

// GET /api/products  (publik untuk pelanggan; staff bisa ?all=1 lihat nonaktif)
exports.list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === '1' && req.user && req.user.type === 'admin';
  res.json({ data: productModel.all({ includeInactive }) });
});

exports.get = asyncHandler(async (req, res) => {
  const p = productModel.findById(+req.params.id);
  if (!p) throw ApiError.notFound('Produk tidak ditemukan');
  res.json(p);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, category, price, stock, desc, emoji } = req.body;
  if (!name) throw ApiError.badRequest('Nama produk wajib diisi');
  if (price == null || isNaN(price) || price < 0) throw ApiError.badRequest('Harga tidak valid');
  const p = productModel.create({
    name, category: category || 'Lainnya', price: Math.round(price),
    stock: Math.max(0, parseInt(stock, 10) || 0), desc: desc || '', emoji: emoji || '🍽️',
  });
  log.add({ actor: actorOf(req), action: 'Tambah produk', detail: name, ip: req.ip });
  res.status(201).json(p);
});

exports.update = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  if (!productModel.findById(id)) throw ApiError.notFound('Produk tidak ditemukan');
  const { name, category, price, stock, desc, emoji } = req.body;
  if (price != null && (isNaN(price) || price < 0)) throw ApiError.badRequest('Harga tidak valid');
  const p = productModel.update(id, {
    name, category, emoji, desc,
    price: price != null ? Math.round(price) : undefined,
    stock: stock != null ? Math.max(0, parseInt(stock, 10) || 0) : undefined,
  });
  log.add({ actor: actorOf(req), action: 'Edit produk', detail: p.name, ip: req.ip });
  res.json(p);
});

// PATCH /api/products/:id/stock  body: { delta } atau { stock }
exports.adjustStock = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = productModel.findById(id);
  if (!cur) throw ApiError.notFound('Produk tidak ditemukan');
  let next;
  if (req.body.stock != null) next = Math.max(0, parseInt(req.body.stock, 10) || 0);
  else if (req.body.delta != null) next = Math.max(0, cur.stock + parseInt(req.body.delta, 10));
  else throw ApiError.badRequest('Sertakan "stock" atau "delta"');
  const p = productModel.setStock(id, next);
  log.add({ actor: actorOf(req), action: 'Ubah stok', detail: `${p.name} → ${p.stock}`, ip: req.ip });
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

exports.exportCSV = asyncHandler(async (req, res) => {
  const rows = [['ID', 'Produk', 'Kategori', 'Harga', 'Stok', 'Aktif']];
  productModel.all({ includeInactive: true }).forEach((p) =>
    rows.push([p.id, p.name, p.category, p.price, p.stock, p.active ? 'ya' : 'tidak']));
  res.header('Content-Type', 'text/csv');
  res.attachment('produk.csv');
  res.send('﻿' + toCSV(rows));
});
