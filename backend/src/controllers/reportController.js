'use strict';
const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/reportService');
const { toCSV } = require('../utils/csv');

function rangeOf(req) {
  const r = String(req.query.range || 'all');
  return ['7', '30'].includes(r) ? r : 'all';
}

// GET /api/reports/sales?range=7|30|all
exports.sales = asyncHandler(async (req, res) => {
  const range = rangeOf(req);
  const perProduct = reportService.perProduct(range);
  const summary = reportService.summary(range);
  const trend = reportService.trend(range);
  res.json({ range, summary, trend, perProduct });
});

// GET /api/reports/sales/export.csv?range=
exports.exportCSV = asyncHandler(async (req, res) => {
  const range = rangeOf(req);
  const rows = [['Produk', 'Kategori', 'Qty Terjual', 'Pendapatan']];
  reportService.perProduct(range).forEach((r) => rows.push([r.name, r.category, r.qty, r.revenue]));
  res.header('Content-Type', 'text/csv');
  res.attachment('laporan_penjualan.csv');
  res.send('﻿' + toCSV(rows));
});
