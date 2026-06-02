'use strict';
const XLSX = require('xlsx');

/**
 * Kirim file XLSX sebagai response Express.
 * @param {object}   res      Express response
 * @param {string}   filename Nama file unduhan
 * @param {Array}    sheets   Array of { name, rows } — rows = array of arrays
 */
function sendXLSX(res, filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); // max 31 karakter
  });
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buf);
}

module.exports = { sendXLSX };
