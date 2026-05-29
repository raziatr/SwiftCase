'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/logController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

router.get('/', ctrl.list);
router.get('/export.csv', ctrl.exportCSV);
router.delete('/', ctrl.clear);

module.exports = router;
