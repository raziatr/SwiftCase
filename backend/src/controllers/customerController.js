'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const customerModel = require('../models/customerModel');
const log = require('../models/logModel');
const { toCSV } = require('../utils/csv');
const { sendXLSX } = require('../utils/xlsx');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');

// GET /api/customers?search=
exports.list = asyncHandler(async (req, res) => {
  res.json({ data: customerModel.all({ search: req.query.search }) });
});

// GET /api/customers/:id
exports.get = asyncHandler(async (req, res) => {
  const c = customerModel.findById(+req.params.id);
  if (!c) throw ApiError.notFound('Pelanggan tidak ditemukan');
  res.json(c);
});

// POST /api/customers
exports.create = asyncHandler(async (req, res) => {
  const { name, phone, email, address, note } = req.body;
  if (!name || !name.trim()) throw ApiError.badRequest('Nama pelanggan wajib diisi');
  if (phone && customerModel.findByPhone(phone)) throw ApiError.conflict('No. telepon sudah terdaftar');
  const c = customerModel.create({ name: name.trim(), phone, email, address, note });
  log.add({ actor: actorOf(req), action: 'Tambah pelanggan', detail: c.name, ip: req.ip });
  res.status(201).json(c);
});

// PUT /api/customers/:id
exports.update = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = customerModel.findById(id);
  if (!cur) throw ApiError.notFound('Pelanggan tidak ditemukan');
  const { name, phone, email, address, note } = req.body;
  const c = customerModel.update(id, { name, phone, email, address, note });
  log.add({
    actor: actorOf(req), action: 'Edit pelanggan', detail: c.name, ip: req.ip,
    before: { name: cur.name, phone: cur.phone, email: cur.email },
    after: { name: c.name, phone: c.phone, email: c.email },
  });
  res.json(c);
});

// DELETE /api/customers/:id
exports.remove = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const c = customerModel.findById(id);
  if (!c) throw ApiError.notFound('Pelanggan tidak ditemukan');
  customerModel.remove(id);
  log.add({ actor: actorOf(req), action: 'Hapus pelanggan', detail: c.name, ip: req.ip });
  res.json({ deleted: true, id });
});

// GET /api/customers/export.csv
exports.exportCSV = asyncHandler(async (_req, res) => {
  const rows = [['ID', 'Nama', 'Telepon', 'Email', 'Alamat', 'Poin']];
  customerModel.all().forEach((c) => rows.push([c.id, c.name, c.phone, c.email, c.address, c.points]));
  res.header('Content-Type', 'text/csv');
  res.attachment('pelanggan.csv');
  res.send('﻿' + toCSV(rows));
});

// GET /api/customers/export.xlsx
exports.exportXLSX = asyncHandler(async (_req, res) => {
  const header = ['ID', 'Nama', 'Telepon', 'Email', 'Alamat', 'Poin'];
  const rows = [header, ...customerModel.all().map((c) => [c.id, c.name, c.phone, c.email, c.address, c.points])];
  sendXLSX(res, 'pelanggan.xlsx', [{ name: 'Pelanggan', rows }]);
});
