'use strict';
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const backupService = require('../services/backupService');
const config = require('../config');
const log = require('../models/logModel');

const actorOf = (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest');

// GET /api/backups  — daftar file backup
exports.list = asyncHandler(async (_req, res) => {
  res.json({ enabled: config.backup.enabled, intervalHours: config.backup.intervalHours, data: backupService.listBackups() });
});

// POST /api/backups  — buat backup manual sekarang
exports.create = asyncHandler(async (req, res) => {
  const info = backupService.runBackup();
  log.add({ actor: actorOf(req), action: 'Backup database (manual)', detail: info.file, ip: req.ip });
  res.status(201).json(info);
});

// GET /api/backups/:file/download  — unduh file backup
exports.download = asyncHandler(async (req, res) => {
  const file = path.basename(req.params.file); // cegah path traversal
  if (!/^swiftcase-[\w-]+\.db$/.test(file)) throw ApiError.badRequest('Nama file tidak valid');
  const full = path.join(config.backup.dir, file);
  if (!fs.existsSync(full)) throw ApiError.notFound('File backup tidak ditemukan');
  res.download(full, file);
});
