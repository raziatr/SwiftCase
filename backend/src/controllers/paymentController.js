'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const xendit = require('../services/xenditService');
const paymentModel = require('../models/paymentModel');
const log = require('../models/logModel');
const sse = require('../utils/sse');
const config = require('../config');

// POST /api/payments/qris  body: { amount, reference?, customer? }
exports.createQris = asyncHandler(async (req, res) => {
  const amount = Math.round(Number(req.body.amount));
  if (!amount || amount <= 0) throw ApiError.badRequest('Nominal tidak valid');
  const referenceId = req.body.reference || ('SC' + Date.now());

  const charge = await xendit.createQris({ referenceId, amount });

  paymentModel.create({
    id: referenceId,
    externalId: charge.id,
    orderRef: req.body.orderRef || null,
    amount,
    method: 'QRIS',
    status: 'PENDING',
    qrString: charge.qr_string,
    raw: charge,
  });

  log.add({ actor: 'guest', action: 'Buat QRIS', detail: `${referenceId} • ${amount}`, ip: req.ip });

  res.status(201).json({
    id: referenceId,
    externalId: charge.id,
    amount,
    status: 'PENDING',
    qrString: charge.qr_string,
    mock: Boolean(charge.mock),
  });
});

// GET /api/payments/:id  → status terkini (dipakai polling frontend)
exports.getStatus = asyncHandler(async (req, res) => {
  const p = paymentModel.findById(req.params.id);
  if (!p) throw ApiError.notFound('Pembayaran tidak ditemukan');
  res.json({ id: p.id, externalId: p.external_id, amount: p.amount, method: p.method, status: p.status });
});

// POST /api/payments/:id/simulate-paid  (hanya tersedia di mode MOCK / dev)
exports.simulatePaid = asyncHandler(async (req, res) => {
  if (!config.xendit.mock && config.env === 'production') {
    throw ApiError.forbidden('Simulasi hanya tersedia di mode mock/dev');
  }
  const p = paymentModel.findById(req.params.id);
  if (!p) throw ApiError.notFound('Pembayaran tidak ditemukan');
  const up = paymentModel.updateStatus(p.id, 'PAID');
  sse.broadcast('payment:paid', { id: p.id, status: 'PAID' });
  log.add({ actor: 'system', action: 'Simulasi pembayaran PAID', detail: p.id, ip: req.ip });
  res.json({ id: up.id, status: up.status });
});
