'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate, requireStaff } = require('../middleware/auth');

router.get('/sales', authenticate, requireStaff, ctrl.sales);
router.get('/sales/export.csv', authenticate, requireStaff, ctrl.exportCSV);
router.get('/sales/export.xlsx', authenticate, requireStaff, ctrl.exportXLSX);
router.get('/sales/export.pdf', authenticate, requireStaff, ctrl.exportPDF);

module.exports = router;
