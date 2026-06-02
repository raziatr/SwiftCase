'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/stockMovementController');
const { authenticate, requireStaff } = require('../middleware/auth');

// Staff (admin & kasir)
router.get('/',              authenticate, requireStaff, ctrl.list);
router.get('/export.csv',   authenticate, requireStaff, ctrl.exportCSV);
router.get('/export.xlsx',  authenticate, requireStaff, ctrl.exportXLSX);

module.exports = router;
