'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/discountController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');

// Publik — pelanggan butuh daftar diskon aktif untuk checkout
router.get('/',              optionalAuth, ctrl.list);
router.get('/eligible',      optionalAuth, ctrl.eligible);
router.get('/:id',           optionalAuth, ctrl.get);

// Admin only
router.post('/',             authenticate, requireRole('admin'), ctrl.create);
router.put('/:id',           authenticate, requireRole('admin'), ctrl.update);
router.patch('/:id/toggle',  authenticate, requireRole('admin'), ctrl.toggle);
router.delete('/:id',        authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
