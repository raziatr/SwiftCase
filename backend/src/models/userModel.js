'use strict';
const { db } = require('../db/database');

module.exports = {
  create({ name, email, phone, passwordHash }) {
    const info = db.prepare(
      'INSERT INTO users(name,email,phone,password_hash) VALUES(?,?,?,?)'
    ).run(name, email, phone || null, passwordHash);
    return this.findById(info.lastInsertRowid);
  },
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email=?').get(email);
  },
  findById(id) {
    return db.prepare('SELECT id,name,email,phone,created_at FROM users WHERE id=?').get(id);
  },
};
