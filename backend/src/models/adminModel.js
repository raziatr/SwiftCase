'use strict';
const { db } = require('../db/database');

const PUBLIC = 'id,name,username,role,created_at';

module.exports = {
  all() {
    return db.prepare(`SELECT ${PUBLIC} FROM admins ORDER BY id`).all();
  },
  findByUsername(username) {
    return db.prepare('SELECT * FROM admins WHERE username=?').get(username);
  },
  findById(id) {
    return db.prepare(`SELECT ${PUBLIC} FROM admins WHERE id=?`).get(id);
  },
  create({ name, username, passwordHash, role }) {
    const info = db.prepare(
      'INSERT INTO admins(name,username,password_hash,role) VALUES(?,?,?,?)'
    ).run(name, username, passwordHash, role || 'kasir');
    return this.findById(info.lastInsertRowid);
  },
  update(id, { name, role, passwordHash }) {
    const cur = db.prepare('SELECT * FROM admins WHERE id=?').get(id);
    if (!cur) return null;
    db.prepare('UPDATE admins SET name=?, role=?, password_hash=? WHERE id=?').run(
      name != null ? name : cur.name,
      role != null ? role : cur.role,
      passwordHash != null ? passwordHash : cur.password_hash,
      id
    );
    return this.findById(id);
  },
  remove(id) {
    return db.prepare('DELETE FROM admins WHERE id=?').run(id).changes;
  },
  count() {
    return db.prepare('SELECT COUNT(*) c FROM admins').get().c;
  },
};
