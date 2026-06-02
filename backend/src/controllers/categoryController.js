'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const categoryModel = require('../models/categoryModel');
const log = require('../models/logModel');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');

// GET /api/categories
exports.list = asyncHandler(async (_req, res) => {
  res.json({ data: categoryModel.all() });
});

// POST /api/categories
exports.create = asyncHandler(async (req, res) => {
  const { name, sortOrder } = req.body;
  if (!name || !String(name).trim()) throw ApiError.badRequest('Nama kategori wajib diisi');
  const trimmed = String(name).trim().slice(0, 50);
  if (categoryModel.findByName(trimmed)) throw ApiError.conflict('Kategori sudah ada');
  const cat = categoryModel.create({ name: trimmed, sortOrder: sortOrder || 0 });
  log.add({ actor: actorOf(req), action: 'Tambah kategori', detail: trimmed, ip: req.ip });
  res.status(201).json(cat);
});

// PUT /api/categories/:id
exports.update = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = categoryModel.findById(id);
  if (!cur) throw ApiError.notFound('Kategori tidak ditemukan');
  const { name, sortOrder } = req.body;
  if (name) {
    const dup = categoryModel.findByName(name.trim());
    if (dup && dup.id !== id) throw ApiError.conflict('Nama kategori sudah dipakai');
  }
  const cat = categoryModel.update(id, { name: name?.trim(), sortOrder });
  log.add({
    actor: actorOf(req), action: 'Edit kategori', detail: cat.name, ip: req.ip,
    before: { name: cur.name, sortOrder: cur.sortOrder },
    after: { name: cat.name, sortOrder: cat.sortOrder },
  });
  res.json(cat);
});

// DELETE /api/categories/:id
exports.remove = asyncHandler(async (req, res) => {
  const id = +req.params.id;
  const cur = categoryModel.findById(id);
  if (!cur) throw ApiError.notFound('Kategori tidak ditemukan');
  if (categoryModel.isUsedByProducts(cur.name)) {
    throw ApiError.conflict('Kategori masih dipakai produk aktif, tidak bisa dihapus');
  }
  categoryModel.remove(id);
  log.add({ actor: actorOf(req), action: 'Hapus kategori', detail: cur.name, ip: req.ip });
  res.json({ deleted: true, id });
});
