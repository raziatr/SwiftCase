'use strict';
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Simpan foto produk di public/uploads agar otomatis dilayani static.
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = 'prod-' + Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safe);
  },
});

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) return cb(ApiError.badRequest('Format gambar harus jpg/png/webp/gif'));
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

module.exports = upload;
