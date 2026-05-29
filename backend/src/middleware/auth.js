'use strict';
const ApiError = require('../utils/ApiError');
const { verify } = require('../utils/jwt');

/** Wajib login (token Bearer valid). Mengisi req.user. */
function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token || null);
  if (!token) return next(ApiError.unauthorized());
  try {
    req.user = verify(token);
    next();
  } catch (_) {
    next(ApiError.unauthorized('Token tidak valid atau kedaluwarsa'));
  }
}

/** Opsional: isi req.user bila ada token, tapi tidak memaksa login. */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = verify(token); } catch (_) { /* abaikan token invalid */ }
  }
  next();
}

/** Harus admin/kasir (type admin). */
function requireStaff(req, _res, next) {
  if (!req.user || req.user.type !== 'admin') return next(ApiError.forbidden('Khusus admin/kasir'));
  next();
}

/** Harus salah satu peran tertentu (mis. requireRole('admin')). */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || req.user.type !== 'admin' || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Akses khusus: ' + roles.join('/')));
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, requireStaff, requireRole };
