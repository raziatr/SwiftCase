'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const adminModel = require('../models/adminModel');
const password = require('../utils/password');
const log = require('../models/logModel');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');
const ROLES = ['admin', 'kasir'];

// GET /api/admins
exports.list = asyncHandler(async (_req, res) => {
  res.json({ data: adminModel.all() });
});

// POST /api/admins
exports.create = asyncHandler(async (req, res) => {
  const { name, username, password: pw, role } = req.body;
  if (!name || !username || !pw) throw ApiError.badRequest('Nama, username, dan password wajib diisi');
  if (role && !ROLES.includes(role)) throw ApiError.badRequest('Peran tidak valid');
  if (adminModel.findByUsername(username)) throw ApiError.conflict('Username sudah dipakai');
  const admin = adminModel.create({ name, username, passwordHash: password.hash(pw), role: role || 'kasir' });
  log.add({ actor: actorOf(req), action: 'Tambah akun', detail: `${username} (${admin.role})`, ip: req.ip });
  res.status(201).json(admin);
});

// PUT /api/admins/:id
exports.update = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = adminModel.findById(id);
  if (!cur) throw ApiError.notFound('Akun tidak ditemukan');
  const { name, role, password: pw } = req.body;
  if (role && !ROLES.includes(role)) throw ApiError.badRequest('Peran tidak valid');
  const admin = adminModel.update(id, {
    name, role,
    passwordHash: pw ? password.hash(pw) : undefined,
  });
  log.add({ actor: actorOf(req), action: 'Edit akun', detail: admin.username, ip: req.ip });
  res.json(admin);
});

// PATCH /api/admins/:id/toggle-active
exports.toggleActive = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  if (req.user && req.user.id === id) throw ApiError.badRequest('Tidak bisa menonaktifkan akun sendiri');
  const cur = adminModel.findById(id);
  if (!cur) throw ApiError.notFound('Akun tidak ditemukan');
  if (cur.active && adminModel.countActive() <= 1) throw ApiError.badRequest('Minimal harus ada 1 akun admin yang aktif');
  const admin = adminModel.toggleActive(id);
  log.add({ actor: actorOf(req), action: admin.active ? 'Aktifkan akun' : 'Nonaktifkan akun', detail: admin.username, ip: req.ip });
  res.json(admin);
});

// DELETE /api/admins/:id
exports.remove = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const target = adminModel.findById(id);
  if (!target) throw ApiError.notFound('Akun tidak ditemukan');
  if (req.user && req.user.id === id) throw ApiError.badRequest('Tidak bisa menghapus akun sendiri');
  if (adminModel.count() <= 1) throw ApiError.badRequest('Minimal harus ada 1 akun admin');
  adminModel.remove(id);
  log.add({ actor: actorOf(req), action: 'Hapus akun', detail: target.username, ip: req.ip });
  res.json({ deleted: true, id });
});
