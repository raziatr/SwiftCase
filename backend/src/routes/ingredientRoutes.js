'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/ingredientController');
const { authenticate, requireStaff, requireRole } = require('../middleware/auth');

// Semua endpoint bahan baku khusus staff (admin & kasir)
router.get('/',             authenticate, requireStaff, ctrl.list);
router.get('/low-stock',    authenticate, requireStaff, ctrl.lowStock);
router.get('/export.csv',   authenticate, requireStaff, ctrl.exportCSV);
router.get('/export.xlsx',  authenticate, requireStaff, ctrl.exportXLSX);
router.get('/:id',          authenticate, requireStaff, ctrl.get);

router.post('/',            authenticate, requireRole('admin'), ctrl.create);
router.put('/:id',          authenticate, requireRole('admin'), ctrl.update);
router.patch('/:id/stock',  authenticate, requireStaff,         ctrl.adjustStock);
router.delete('/:id',       authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
