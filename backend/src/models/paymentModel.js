'use strict';
const { db } = require('../db/database');

module.exports = {
  create({ id, externalId, orderRef, amount, method, status, qrString, raw }) {
    db.prepare(
      'INSERT INTO payments(id,external_id,order_ref,amount,method,status,qr_string,raw) VALUES(?,?,?,?,?,?,?,?)'
    ).run(id, externalId || null, orderRef || null, amount, method || 'QRIS', status || 'PENDING', qrString || null, raw ? JSON.stringify(raw) : null);
    return this.findById(id);
  },
  findById(id) { return db.prepare('SELECT * FROM payments WHERE id=?').get(id); },
  findByExternal(eid) { return db.prepare('SELECT * FROM payments WHERE external_id=?').get(eid); },
  updateStatus(id, status) {
    db.prepare("UPDATE payments SET status=?, updated_at=datetime('now') WHERE id=?").run(status, id);
    return this.findById(id);
  },
};
