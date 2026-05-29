'use strict';
/**
 * Global error handler (implementasi dari poin "Global Error Handler").
 * Menangkap semua error, mengembalikan JSON konsisten, menyembunyikan detail
 * internal di produksi, dan mencatat error 500 ke console + tabel audit.
 */
const config = require('../config');
const logModel = require('../models/logModel');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500;
  const isServer = status >= 500;

  const body = {
    error: {
      message: isServer && config.env === 'production' ? 'Terjadi kesalahan pada server' : err.message,
    },
  };
  if (err.details) body.error.details = err.details;
  if (isServer && config.env !== 'production') body.error.stack = err.stack;

  if (isServer) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', req.method, req.originalUrl, '\n', err);
  }

  // best-effort audit (jangan sampai gagal-melempar di dalam handler error)
  try {
    logModel.add({
      actor: req.user ? `${req.user.type}:${req.user.sub}` : 'guest',
      action: `ERROR ${status}`,
      detail: `${req.method} ${req.originalUrl} — ${err.message}`,
      ip: req.ip,
    });
  } catch (_) { /* ignore */ }

  res.status(status).json(body);
};
