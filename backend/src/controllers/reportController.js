'use strict';
const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/reportService');
const { toCSV } = require('../utils/csv');
const { sendXLSX } = require('../utils/xlsx');
const { sendReportPDF } = require('../utils/pdf');

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

/** Opsi range dari query: range=7|30|all atau from/to (custom). */
function rangeOpts(req) {
  const range = String(req.query.range || 'all');
  const from = req.query.from || null;
  const to = req.query.to || null;
  if (from || to) return { range: 'custom', from, to };
  return { range: ['7', '30'].includes(range) ? range : 'all' };
}

function rangeLabel(opts) {
  if (opts.range === 'custom') return `Periode: ${opts.from || '—'} s/d ${opts.to || '—'}`;
  if (opts.range === '7') return 'Periode: 7 hari terakhir';
  if (opts.range === '30') return 'Periode: 30 hari terakhir';
  return 'Periode: Semua waktu';
}

// GET /api/reports/sales?range=&from=&to=
exports.sales = asyncHandler(async (req, res) => {
  const opts = rangeOpts(req);
  res.json({
    opts,
    summary: reportService.summary(opts),
    trend: reportService.trend(opts),
    perProduct: reportService.perProduct(opts),
    perPayMethod: reportService.perPayMethod(opts),
  });
});

// GET /api/reports/sales/export.csv
exports.exportCSV = asyncHandler(async (req, res) => {
  const opts = rangeOpts(req);
  const rows = [['Produk', 'Kategori', 'Qty Terjual', 'Pendapatan (Rp)']];
  reportService.perProduct(opts).forEach((r) => rows.push([r.name, r.category, r.qty, r.revenue]));
  res.header('Content-Type', 'text/csv');
  res.attachment('laporan_penjualan.csv');
  res.send('﻿' + toCSV(rows));
});

// GET /api/reports/sales/export.xlsx
exports.exportXLSX = asyncHandler(async (req, res) => {
  const opts = rangeOpts(req);
  const summary = reportService.summary(opts);
  const perProduct = reportService.perProduct(opts);
  const trend = reportService.trend(opts);
  const perPayMethod = reportService.perPayMethod(opts);
  const rawOrders = reportService.rawOrders(opts);

  sendXLSX(res, 'laporan_swiftcase.xlsx', [
    { name: 'Ringkasan', rows: [
      ['Metrik', 'Nilai'],
      ['Total Pesanan', summary.orders], ['Item Terjual', summary.items],
      ['Subtotal', summary.subtotal], ['Total Diskon', summary.discountTotal],
      ['Total PPN', summary.taxTotal], ['Total Pendapatan', summary.revenue],
    ] },
    { name: 'Per Produk', rows: [
      ['Produk', 'Kategori', 'Qty Terjual', 'Pendapatan (Rp)'],
      ...perProduct.map((r) => [r.name, r.category, r.qty, r.revenue]),
    ] },
    { name: 'Tren Harian', rows: [
      ['Tanggal', 'Pendapatan (Rp)', 'Pesanan'],
      ...trend.map((r) => [r.day, r.total, r.orders]),
    ] },
    { name: 'Per Metode Bayar', rows: [
      ['Metode', 'Pesanan', 'Pendapatan (Rp)'],
      ...perPayMethod.map((r) => [r.method, r.orders, r.revenue]),
    ] },
    { name: 'Detail Pesanan', rows: [
      ['ID', 'Antrian', 'Pelanggan', 'Item', 'Metode Bayar', 'Diskon', 'PPN', 'Total', 'Status', 'Waktu'],
      ...rawOrders.map((o) => [o.id, o.queue_no, o.customer_name, o.items_summary || '',
        o.pay_method, o.discount_name || '-', o.tax_amount, o.total, o.status, o.created_at]),
    ] },
  ]);
});

// GET /api/reports/sales/export.pdf
exports.exportPDF = asyncHandler(async (req, res) => {
  const opts = rangeOpts(req);
  const summary = reportService.summary(opts);
  const perProduct = reportService.perProduct(opts);
  const perPayMethod = reportService.perPayMethod(opts);

  sendReportPDF(res, 'laporan_penjualan.pdf', {
    title: 'Laporan Penjualan',
    subtitle: rangeLabel(opts),
    summary: [
      ['Total Pesanan', summary.orders], ['Item Terjual', summary.items],
      ['Subtotal', rp(summary.subtotal)], ['Total Diskon', rp(summary.discountTotal)],
      ['Total PPN', rp(summary.taxTotal)], ['Total Pendapatan', rp(summary.revenue)],
    ],
    sections: [
      { heading: 'Penjualan per Produk', columns: [
        { label: 'Produk', width: 200 }, { label: 'Kategori', width: 120 },
        { label: 'Qty', width: 80, align: 'right' }, { label: 'Pendapatan', width: 115, align: 'right' },
      ], rows: perProduct.map((r) => [r.name, r.category, r.qty, rp(r.revenue)]) },
      { heading: 'Penjualan per Metode Pembayaran', columns: [
        { label: 'Metode', width: 200 }, { label: 'Jumlah Pesanan', width: 160, align: 'right' },
        { label: 'Pendapatan', width: 155, align: 'right' },
      ], rows: perPayMethod.map((r) => [r.method, r.orders, rp(r.revenue)]) },
    ],
  });
});
