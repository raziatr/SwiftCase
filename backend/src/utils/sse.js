'use strict';
/**
 * Hub Server-Sent Events sederhana untuk notifikasi real-time
 * (implementasi "real" dari poin "Real-time Order Notifikasi").
 * Controller memanggil broadcast() saat ada pesanan baru / update status,
 * dan semua client admin yang terhubung ke /api/events/orders menerimanya.
 */
const clients = new Set();

function addClient(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch (_) { clients.delete(res); }
  }
}

module.exports = { addClient, broadcast, clientCount: () => clients.size };
