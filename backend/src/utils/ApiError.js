'use strict';
/** Error operasional dengan HTTP status — ditangani oleh global error handler. */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(msg = 'Permintaan tidak valid', details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Tidak terautentikasi') { return new ApiError(401, msg); }
  static forbidden(msg = 'Akses ditolak') { return new ApiError(403, msg); }
  static notFound(msg = 'Tidak ditemukan') { return new ApiError(404, msg); }
  static conflict(msg = 'Konflik data', details) { return new ApiError(409, msg, details); }
}
module.exports = ApiError;
