'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/eventController');

// SSE stream untuk notifikasi pesanan real-time.
// Dibiarkan terbuka karena EventSource tidak bisa mengirim header Authorization;
// di produksi amankan via cookie sesi atau ?token= + verifikasi.
router.get('/orders', ctrl.stream);

module.exports = router;
