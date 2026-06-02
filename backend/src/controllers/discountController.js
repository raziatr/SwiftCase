'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const discountModel = require('../models/discountModel');
const log = require('../models/logModel');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');
const VALID_TYPES = ['percent', 'fixed'];
const VALID_SCOPES = ['order', 'item'];

// GET /api/discounts  (publik: hanya aktif; staff: ?all=1 lihat semua)
exports.list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === '1' && req.user && req.user.type === 'admin';
  res.json({ data: discountModel.all({ includeInactive }) });
});

// GET /api/discounts/eligible?total=&scope=order|item  (untuk checkout)
exports.eligible = asyncHandler(async (req, res) => {
  const total = parseInt(req.query.total, 10) || 0;
  const scope = req.query.scope; // opsional: filter 'order' / 'item'
  res.json({ data: discountModel.eligible(total, scope) });
});

// GET /api/discounts/:id
exports.get = asyncHandler(async (req, res) => {
  const d = discountModel.findById(+req.params.id);
  if (!d) throw ApiError.notFound('Diskon tidak ditemukan');
  res.json(d);
});

// POST /api/discounts
exports.create = asyncHandler(async (req, res) => {
  const { name, type, scope, value, minOrder, expiresAt } = req.body;
  if (!name) throw ApiError.badRequest('Nama diskon wajib diisi');
  if (!VALID_TYPES.includes(type)) throw ApiError.badRequest('Tipe harus "percent" atau "fixed"');
  if (scope && !VALID_SCOPES.includes(scope)) throw ApiError.badRequest('Scope harus "order" atau "item"');
  if (value == null || isNaN(value) || value <= 0) throw ApiError.badRequest('Nilai diskon tidak valid');
  if (type === 'percent' && value > 100) throw ApiError.badRequest('Persentase tidak boleh melebihi 100%');
  const d = discountModel.create({
    name, type, scope: scope || 'order', value: parseFloat(value),
    minOrder: parseInt(minOrder, 10) || 0,
    expiresAt: expiresAt || null,
  });
  log.add({ actor: actorOf(req), action: 'Tambah diskon', detail: `${name} (${type} ${value}, ${scope || 'order'})`, ip: req.ip });
  res.status(201).json(d);
});

// PUT /api/discounts/:id
exports.update = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = discountModel.findById(id);
  if (!cur) throw ApiError.notFound('Diskon tidak ditemukan');
  const { name, type, scope, value, minOrder, expiresAt } = req.body;
  if (type && !VALID_TYPES.includes(type)) throw ApiError.badRequest('Tipe tidak valid');
  if (scope && !VALID_SCOPES.includes(scope)) throw ApiError.badRequest('Scope tidak valid');
  if (value != null && (isNaN(value) || value <= 0)) throw ApiError.badRequest('Nilai tidak valid');
  if (type === 'percent' && value > 100) throw ApiError.badRequest('Persentase tidak boleh melebihi 100%');
  const d = discountModel.update(id, {
    name, type, scope,
    value: value != null ? parseFloat(value) : undefined,
    minOrder: minOrder != null ? parseInt(minOrder, 10) : undefined,
    expiresAt,
  });
  log.add({
    actor: actorOf(req), action: 'Edit diskon', detail: d.name, ip: req.ip,
    before: { name: cur.name, type: cur.type, value: cur.value, minOrder: cur.minOrder, expiresAt: cur.expiresAt },
    after: { name: d.name, type: d.type, value: d.value, minOrder: d.minOrder, expiresAt: d.expiresAt },
  });
  res.json(d);
});

// PATCH /api/discounts/:id/toggle
exports.toggle = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const d = discountModel.toggleActive(id);
  if (!d) throw ApiError.notFound('Diskon tidak ditemukan');
  log.add({ actor: actorOf(req), action: d.active ? 'Aktifkan diskon' : 'Nonaktifkan diskon', detail: d.name, ip: req.ip });
  res.json(d);
});

// DELETE /api/discounts/:id
exports.remove = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const d = discountModel.findById(id);
  if (!d) throw ApiError.notFound('Diskon tidak ditemukan');
  discountModel.remove(id);
  log.add({ actor: actorOf(req), action: 'Hapus diskon', detail: d.name, ip: req.ip });
  res.json({ deleted: true, id });
});
