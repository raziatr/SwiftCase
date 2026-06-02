'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/customerController');
const { authenticate, requireStaff, requireRole } = require('../middleware/auth');

// Staff (admin & kasir) boleh lihat & pilih pelanggan saat transaksi
router.get('/',             authenticate, requireStaff, ctrl.list);
router.get('/export.csv',   authenticate, requireStaff, ctrl.exportCSV);
router.get('/export.xlsx',  authenticate, requireStaff, ctrl.exportXLSX);
router.get('/:id',          authenticate, requireStaff, ctrl.get);

router.post('/',            authenticate, requireStaff,         ctrl.create);
router.put('/:id',          authenticate, requireStaff,         ctrl.update);
router.delete('/:id',       authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
