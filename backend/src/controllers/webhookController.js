'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const xendit = require('../services/xenditService');
const paymentModel = require('../models/paymentModel');
const sse = require('../utils/sse');
const log = require('../models/logModel');

/**
 * POST /api/webhooks/xendit
 * Callback dari Xendit saat status QRIS berubah (mis. pembayaran sukses).
 * Verifikasi token via header x-callback-token, lalu update status pembayaran
 * dan broadcast ke admin lewat SSE.
 *
 * Bentuk payload QR (ringkas):
 *   { event:'qr.payment', data:{ qr_id, reference_id, amount, status } }
 * atau callback qr_code lama: { id, reference_id, status, ... }
 */
exports.xendit = asyncHandler(async (req, res) => {
  const token = req.header('x-callback-token');
  if (!xendit.verifyCallbackToken(token)) throw ApiError.unauthorized('Callback token tidak valid');

  const body = req.body || {};
  const data = body.data || body;
  const referenceId = data.reference_id || data.reference || body.reference_id;
  const externalId = data.qr_id || data.id || body.id;
  const status = xendit.normalizeStatus(data.status || body.status);

  let payment = null;
  if (referenceId) payment = paymentModel.findById(referenceId);
  if (!payment && externalId) payment = paymentModel.findByExternal(externalId);

  if (payment && status !== 'PENDING') {
    paymentModel.updateStatus(payment.id, status);
    sse.broadcast('payment:update', { id: payment.id, status });
  }

  log.add({ actor: 'xendit', action: 'Webhook diterima', detail: `${referenceId || externalId || '?'} → ${status}`, ip: req.ip });
  // Selalu 200 agar Xendit tidak retry berlebihan untuk event yang sudah diproses.
  res.json({ received: true });
});
