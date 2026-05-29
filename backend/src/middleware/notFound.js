'use strict';
const ApiError = require('../utils/ApiError');
module.exports = (req, _res, next) =>
  next(ApiError.notFound(`Rute tidak ditemukan: ${req.method} ${req.originalUrl}`));
