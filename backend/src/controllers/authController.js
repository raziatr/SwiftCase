'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/userModel');
const adminModel = require('../models/adminModel');
const password = require('../utils/password');
const { sign } = require('../utils/jwt');
const log = require('../models/logModel');

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, password: pw } = req.body;
  if (!name || !email || !pw) throw ApiError.badRequest('Nama, email, dan password wajib diisi');
  if (!emailRe.test(email)) throw ApiError.badRequest('Format email tidak valid');
  if (String(pw).length < 6) throw ApiError.badRequest('Password minimal 6 karakter');
  if (userModel.findByEmail(email)) throw ApiError.conflict('Email sudah terdaftar');

  const user = userModel.create({ name, email, phone, passwordHash: password.hash(pw) });
  log.add({ actor: 'cust:' + email, action: 'Registrasi pelanggan', detail: email, ip: req.ip });
  const token = sign({ sub: email, id: user.id, type: 'customer', name: user.name });
  res.status(201).json({ token, user });
});

exports.loginCustomer = asyncHandler(async (req, res) => {
  const { email, password: pw } = req.body;
  if (!email || !pw) throw ApiError.badRequest('Email dan password wajib diisi');
  const user = userModel.findByEmail(email);
  if (!user || !password.compare(pw, user.password_hash)) {
    log.add({ actor: 'cust:' + email, action: 'Login pelanggan GAGAL', detail: email, ip: req.ip });
    throw ApiError.unauthorized('Email atau password salah');
  }
  log.add({ actor: 'cust:' + email, action: 'Login pelanggan', detail: email, ip: req.ip });
  const token = sign({ sub: email, id: user.id, type: 'customer', name: user.name });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

exports.loginAdmin = asyncHandler(async (req, res) => {
  const { username, password: pw } = req.body;
  if (!username || !pw) throw ApiError.badRequest('Username dan password wajib diisi');
  const admin = adminModel.findByUsername(username);
  if (!admin || !password.compare(pw, admin.password_hash)) {
    log.add({ actor: 'admin:' + username, action: 'Login admin GAGAL', detail: username, ip: req.ip });
    throw ApiError.unauthorized('Username atau password salah');
  }
  if (admin.active === 0 || admin.active === false) {
    log.add({ actor: 'admin:' + username, action: 'Login admin DITOLAK (nonaktif)', detail: username, ip: req.ip });
    throw ApiError.forbidden('Akun ini telah dinonaktifkan. Hubungi administrator.');
  }
  log.add({ actor: 'admin:' + username, action: 'Login admin', detail: `${username} (${admin.role})`, ip: req.ip });
  const token = sign({ sub: username, id: admin.id, type: 'admin', role: admin.role, name: admin.name });
  res.json({ token, admin: { id: admin.id, name: admin.name, username: admin.username, role: admin.role } });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
