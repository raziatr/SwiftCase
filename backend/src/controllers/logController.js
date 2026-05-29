'use strict';
const asyncHandler = require('../utils/asyncHandler');
const logModel = require('../models/logModel');
const { toCSV } = require('../utils/csv');

// GET /api/logs?limit=
exports.list = asyncHandler(async (req, res) => {
  const limit = Math.min(500, parseInt(req.query.limit, 10) || 200);
  res.json({ data: logModel.list({ limit }) });
});

// DELETE /api/logs
exports.clear = asyncHandler(async (req, res) => {
  const n = logModel.clear();
  logModel.add({ actor: req.user ? `${req.user.type}:${req.user.sub}` : 'system', action: 'Bersihkan log', detail: `${n} baris dihapus`, ip: req.ip });
  res.json({ cleared: n });
});

// GET /api/logs/export.csv
exports.exportCSV = asyncHandler(async (_req, res) => {
  const rows = [['Waktu', 'Aktor', 'Aksi', 'Detail', 'IP']];
  logModel.list({ limit: 500 }).forEach((l) => rows.push([l.created_at, l.actor, l.action, l.detail, l.ip]));
  res.header('Content-Type', 'text/csv');
  res.attachment('log_aktivitas.csv');
  res.send('﻿' + toCSV(rows));
});
