'use strict';
const { db } = require('../db/database');

module.exports = {
  add({ actor, action, detail, ip }) {
    try {
      db.prepare('INSERT INTO activity_logs(actor,action,detail,ip) VALUES(?,?,?,?)')
        .run(actor || 'system', action, detail || '', ip || '');
    } catch (_) { /* logging tidak boleh menggagalkan request */ }
  },
  list({ limit = 200 } = {}) {
    return db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?').all(limit);
  },
  clear() {
    return db.prepare('DELETE FROM activity_logs').run().changes;
  },
};
