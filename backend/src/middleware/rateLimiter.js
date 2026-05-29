'use strict';
/**
 * Rate limiting "real" dengan express-rate-limit (implementasi dari poin
 * "Rate Limiting"). Dua limiter:
 *  - apiLimiter  : pembatas umum untuk seluruh /api
 *  - authLimiter : pembatas ketat untuk endpoint login (cegah brute force)
 */
const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' } },
});

const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  // Kunci per kombinasi IP + identitas yang dicoba (email/username)
  keyGenerator: (req) => req.ip + ':' + ((req.body && (req.body.email || req.body.username)) || ''),
  message: { error: { message: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.' } },
});

module.exports = { apiLimiter, authLimiter };
