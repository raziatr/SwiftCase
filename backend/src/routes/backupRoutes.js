'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/backupController');
const { authenticate, requireRole } = require('../middleware/auth');

// Semua operasi backup khusus admin
router.get('/',                  authenticate, requireRole('admin'), ctrl.list);
router.post('/',                 authenticate, requireRole('admin'), ctrl.create);
router.get('/:file/download',    authenticate, requireRole('admin'), ctrl.download);

module.exports = router;
