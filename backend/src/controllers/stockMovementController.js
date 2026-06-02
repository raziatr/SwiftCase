'use strict';
const asyncHandler = require('../utils/asyncHandler');
const stockMovementModel = require('../models/stockMovementModel');
const { toCSV } = require('../utils/csv');
const { sendXLSX } = require('../utils/xlsx');

const PER_PAGE = 50;

// GET /api/stock-movements?productId=&page=
exports.list = asyncHandler(async (req, res) => {
  const productId = req.query.productId ? +req.query.productId : null;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = PER_PAGE;
  const offset = (page - 1) * limit;

  const total = stockMovementModel.count({ productId });
  const data = stockMovementModel.list({ productId, limit, offset });
  res.json({ data, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
});

// GET /api/stock-movements/export.csv
exports.exportCSV = asyncHandler(async (req, res) => {
  const productId = req.query.productId ? +req.query.productId : null;
  const rows = [['Waktu', 'Produk', 'Perubahan', 'Sebelum', 'Sesudah', 'Alasan', 'Aktor']];
  stockMovementModel.all({ productId }).forEach((m) =>
    rows.push([m.createdAt, m.productName, m.delta, m.stockBefore, m.stockAfter, m.reason, m.actor || ''])
  );
  res.header('Content-Type', 'text/csv');
  res.attachment('riwayat_stok.csv');
  res.send('﻿' + toCSV(rows));
});

// GET /api/stock-movements/export.xlsx
exports.exportXLSX = asyncHandler(async (req, res) => {
  const productId = req.query.productId ? +req.query.productId : null;
  const header = ['Waktu', 'Produk', 'Perubahan', 'Sebelum', 'Sesudah', 'Alasan', 'Aktor'];
  const rows = [header, ...stockMovementModel.all({ productId }).map((m) =>
    [m.createdAt, m.productName, m.delta, m.stockBefore, m.stockAfter, m.reason, m.actor || '']
  )];
  sendXLSX(res, 'riwayat_stok.xlsx', [{ name: 'Riwayat Stok', rows }]);
});
