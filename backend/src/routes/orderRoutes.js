'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { authenticate, optionalAuth, requireStaff } = require('../middleware/auth');

// Buat pesanan: pelanggan login atau tamu (optionalAuth mengisi user bila ada)
router.post('/', optionalAuth, ctrl.create);

// Riwayat pesanan milik pelanggan yang login
router.get('/mine', authenticate, ctrl.myOrders);

// Staff (rute statis didefinisikan sebelum '/:id')
router.get('/new-count', authenticate, requireStaff, ctrl.newCount);
router.get('/export.csv', authenticate, requireStaff, ctrl.exportCSV);
router.get('/', authenticate, requireStaff, ctrl.list);
router.get('/:id', authenticate, requireStaff, ctrl.get);
router.patch('/:id/status', authenticate, requireStaff, ctrl.updateStatus);

module.exports = router;
