'use strict';
const { db } = require('../db/database');

function serialize(v) {
  if (v == null) return null;
  return typeof v === 'string' ? v : JSON.stringify(v);
}

module.exports = {
  /** Catat aktivitas. Sertakan before/after untuk audit trail data master. */
  add({ actor, action, detail, before, after, ip }) {
    try {
      db.prepare(
        'INSERT INTO activity_logs(actor,action,detail,before_value,after_value,ip) VALUES(?,?,?,?,?,?)'
      ).run(actor || 'system', action, detail || '', serialize(before), serialize(after), ip || '');
    } catch (_) { /* logging tidak boleh menggagalkan request */ }
  },
  list({ limit = 200 } = {}) {
    return db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?').all(limit);
  },
  clear() {
    return db.prepare('DELETE FROM activity_logs').run().changes;
  },
};
