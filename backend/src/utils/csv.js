'use strict';
/** Helper konversi array-of-arrays menjadi string CSV (aman quote). */
function cell(v) {
  v = v == null ? '' : String(v);
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function toCSV(rows) {
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}
module.exports = { toCSV };
