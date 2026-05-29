'use strict';
const sse = require('../utils/sse');
const orderModel = require('../models/orderModel');

/**
 * GET /api/events/orders  — Server-Sent Events stream.
 * Admin/kasir berlangganan di sini untuk menerima notifikasi pesanan baru
 * (event 'order:new') dan perubahan status (event 'order:update') secara
 * real-time tanpa polling.
 */
exports.stream = (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  if (res.flushHeaders) res.flushHeaders();

  // event awal: jumlah pesanan baru saat ini
  res.write(`event: hello\ndata: ${JSON.stringify({ newCount: orderModel.countNew() })}\n\n`);
  sse.addClient(res);

  // keep-alive comment tiap 25s agar koneksi tidak diputus proxy
  const ka = setInterval(() => { try { res.write(': keep-alive\n\n'); } catch (_) { clearInterval(ka); } }, 25000);
  req.on('close', () => clearInterval(ka));
};
