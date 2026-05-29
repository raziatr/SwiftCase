'use strict';
/**
 * Request logging "real" dengan morgan (implementasi dari poin "Request
 * Logging"). Format kustom menyertakan aktor (admin/customer/guest) yang
 * diisi oleh middleware auth. Morgan menulis saat respons selesai sehingga
 * req.user sudah terisi bila rute terproteksi.
 */
const morgan = require('morgan');

morgan.token('actor', (req) => (req.user ? `${req.user.type}:${req.user.sub}` : 'guest'));

const format = ':actor :method :url :status :res[content-length] - :response-time ms';

module.exports = morgan(format);
