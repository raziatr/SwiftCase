'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const { authenticate, requireRole } = require('../middleware/auth');

// Publik — pelanggan butuh daftar kategori untuk tampilan menu
router.get('/', ctrl.list);

// Admin only
router.post('/',    authenticate, requireRole('admin'), ctrl.create);
router.put('/:id',  authenticate, requireRole('admin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
