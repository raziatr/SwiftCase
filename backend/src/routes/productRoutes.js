'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/productController');
const upload = require('../middleware/upload');
const { authenticate, optionalAuth, requireStaff, requireRole } = require('../middleware/auth');

// Publik (pelanggan melihat menu)
router.get('/', optionalAuth, ctrl.list);

// Staff
router.get('/low-stock', authenticate, requireStaff, ctrl.lowStock);
router.get('/export.csv', authenticate, requireStaff, ctrl.exportCSV);
router.get('/export.xlsx', authenticate, requireStaff, ctrl.exportXLSX);
router.get('/barcode/:code', authenticate, requireStaff, ctrl.byBarcode);

router.get('/:id', optionalAuth, ctrl.get);

// CRUD — tambah/edit/hapus khusus admin; ubah stok boleh kasir
router.post('/', authenticate, requireRole('admin'), ctrl.create);
router.post('/upload', authenticate, requireRole('admin'), upload.single('image'), ctrl.uploadImage);
router.put('/:id', authenticate, requireRole('admin'), ctrl.update);
router.patch('/:id/stock', authenticate, requireStaff, ctrl.adjustStock);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
