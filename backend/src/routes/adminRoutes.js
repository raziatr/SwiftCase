'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

// Semua manajemen akun khusus peran 'admin'
router.use(authenticate, requireRole('admin'));

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/toggle-active', ctrl.toggleActive);
router.delete('/:id', ctrl.remove);

module.exports = router;
