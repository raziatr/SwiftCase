'use strict';
/**
 * Integrasi pembayaran QRIS dengan Xendit.
 *
 * - Bila XENDIT_SECRET_KEY kosong → MODE MOCK: mengembalikan charge palsu
 *   sehingga seluruh alur (buat QR → bayar → webhook) bisa diuji lokal
 *   tanpa kredensial. Set secret key untuk memakai API Xendit sungguhan.
 * - Memakai global fetch (Node 18+), tanpa SDK tambahan, agar transparan.
 *
 * Dokumentasi: https://docs.xendit.co/qr-codes
 */
const crypto = require('crypto');
const config = require('../config');

/** Buat QRIS dynamic. Return objek berisi minimal { id, qr_string, status }. */
async function createQris({ referenceId, amount }) {
  if (config.xendit.mock) {
    return {
      id: 'qr_mock_' + crypto.randomBytes(6).toString('hex'),
      reference_id: referenceId,
      type: 'DYNAMIC',
      currency: 'IDR',
      amount,
      status: 'ACTIVE',
      // QR string dummy (format menyerupai EMV QRIS) — cukup untuk dirender jadi QR.
      qr_string: '00020101021226' + referenceId + '5204000053033605802ID5909SwiftCase6007Jakarta' + '54' + String(amount).length + amount,
      mock: true,
    };
  }

  const res = await fetch(config.xendit.baseUrl + '/qr_codes', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(config.xendit.secretKey + ':').toString('base64'),
      'Content-Type': 'application/json',
      'api-version': '2022-07-31',
    },
    body: JSON.stringify({ reference_id: referenceId, type: 'DYNAMIC', currency: 'IDR', amount }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Gagal membuat QRIS di Xendit');
    err.statusCode = res.status === 401 ? 502 : (res.status || 502);
    err.details = data;
    throw err;
  }
  return data;
}

/** Verifikasi token webhook dari header x-callback-token. */
function verifyCallbackToken(token) {
  if (config.xendit.mock) return true; // di mode mock, terima semua (dev only)
  return Boolean(token) && token === config.xendit.callbackToken;
}

/** Normalisasi status Xendit → status internal kami. */
function normalizeStatus(raw) {
  const s = String(raw || '').toUpperCase();
  if (['SUCCEEDED', 'COMPLETED', 'PAID', 'SETTLED'].includes(s)) return 'PAID';
  if (['EXPIRED', 'INACTIVE'].includes(s)) return 'EXPIRED';
  if (['FAILED'].includes(s)) return 'FAILED';
  return 'PENDING';
}

module.exports = { createQris, verifyCallbackToken, normalizeStatus };
