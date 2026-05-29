'use strict';
/** Bungkus handler async agar error otomatis diteruskan ke next(). */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
