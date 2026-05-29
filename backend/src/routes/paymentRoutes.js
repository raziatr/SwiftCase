'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/paymentController');

// Publik: dipanggil dari halaman checkout pelanggan
router.post('/qris', ctrl.createQris);
router.get('/:id', ctrl.getStatus);
router.post('/:id/simulate-paid', ctrl.simulatePaid); // dev/mock only

module.exports = router;
