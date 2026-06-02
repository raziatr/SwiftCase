'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ingredientModel = require('../models/ingredientModel');
const stockMovementModel = require('../models/stockMovementModel');
const log = require('../models/logModel');
const { toCSV } = require('../utils/csv');
const { sendXLSX } = require('../utils/xlsx');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');

// GET /api/ingredients
exports.list = asyncHandler(async (_req, res) => {
  res.json({ data: ingredientModel.all() });
});

// GET /api/ingredients/low-stock
exports.lowStock = asyncHandler(async (_req, res) => {
  res.json({ data: ingredientModel.lowStock() });
});

// GET /api/ingredients/:id
exports.get = asyncHandler(async (req, res) => {
  const ing = ingredientModel.findById(+req.params.id);
  if (!ing) throw ApiError.notFound('Bahan baku tidak ditemukan');
  res.json(ing);
});

// POST /api/ingredients
exports.create = asyncHandler(async (req, res) => {
  const { name, unit, qty, minStock } = req.body;
  if (!name) throw ApiError.badRequest('Nama bahan wajib diisi');
  const ing = ingredientModel.create({
    name, unit: unit || 'pcs',
    qty: Math.max(0, parseFloat(qty) || 0),
    minStock: Math.max(0, parseFloat(minStock) || 0),
  });
  log.add({ actor: actorOf(req), action: 'Tambah bahan baku', detail: `${name} (${ing.qty} ${ing.unit})`, ip: req.ip });
  res.status(201).json(ing);
});

// PUT /api/ingredients/:id
exports.update = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = ingredientModel.findById(id);
  if (!cur) throw ApiError.notFound('Bahan baku tidak ditemukan');
  const { name, unit, qty, minStock } = req.body;
  const ing = ingredientModel.update(id, {
    name, unit,
    qty: qty != null ? Math.max(0, parseFloat(qty)) : undefined,
    minStock: minStock != null ? Math.max(0, parseFloat(minStock)) : undefined,
  });
  log.add({
    actor: actorOf(req), action: 'Edit bahan baku', detail: ing.name, ip: req.ip,
    before: { name: cur.name, unit: cur.unit, qty: cur.qty, minStock: cur.minStock },
    after: { name: ing.name, unit: ing.unit, qty: ing.qty, minStock: ing.minStock },
  });
  res.json(ing);
});

// PATCH /api/ingredients/:id/stock  body: { delta } atau { qty }, reason
exports.adjustStock = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = ingredientModel.findById(id);
  if (!cur) throw ApiError.notFound('Bahan baku tidak ditemukan');

  let next;
  if (req.body.qty != null) next = Math.max(0, parseFloat(req.body.qty) || 0);
  else if (req.body.delta != null) next = Math.max(0, cur.qty + parseFloat(req.body.delta));
  else throw ApiError.badRequest('Sertakan "qty" atau "delta"');

  const reason = (req.body.reason || 'Manual').trim();
  const delta = next - cur.qty;
  const ing = ingredientModel.setQty(id, next);

  // Catat ke riwayat pergerakan (pakai prefix BAHAN agar terbedakan)
  stockMovementModel.record({
    productId: null, productName: `[Bahan] ${ing.name}`, delta,
    reason, stockBefore: cur.qty, stockAfter: next, actor: actorOf(req),
  });
  log.add({ actor: actorOf(req), action: 'Ubah stok bahan', detail: `${ing.name}: ${cur.qty}→${next} ${ing.unit} (${reason})`, ip: req.ip });
  res.json(ing);
});

// DELETE /api/ingredients/:id
exports.remove = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const ing = ingredientModel.findById(id);
  if (!ing) throw ApiError.notFound('Bahan baku tidak ditemukan');
  ingredientModel.remove(id);
  log.add({ actor: actorOf(req), action: 'Hapus bahan baku', detail: ing.name, ip: req.ip });
  res.json({ deleted: true, id });
});

// GET /api/ingredients/export.csv
exports.exportCSV = asyncHandler(async (_req, res) => {
  const rows = [['ID', 'Nama', 'Satuan', 'Stok', 'Min. Stok', 'Status']];
  ingredientModel.all().forEach((i) =>
    rows.push([i.id, i.name, i.unit, i.qty, i.minStock, i.low ? 'PERLU RESTOK' : 'Aman']));
  res.header('Content-Type', 'text/csv');
  res.attachment('bahan_baku.csv');
  res.send('﻿' + toCSV(rows));
});

// GET /api/ingredients/export.xlsx
exports.exportXLSX = asyncHandler(async (_req, res) => {
  const header = ['ID', 'Nama', 'Satuan', 'Stok', 'Min. Stok', 'Status'];
  const rows = [header, ...ingredientModel.all().map((i) =>
    [i.id, i.name, i.unit, i.qty, i.minStock, i.low ? 'PERLU RESTOK' : 'Aman'])];
  sendXLSX(res, 'bahan_baku.xlsx', [{ name: 'Bahan Baku', rows }]);
});
