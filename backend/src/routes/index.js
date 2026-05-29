'use strict';
const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/admins', require('./adminRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/events', require('./eventRoutes'));
router.use('/logs', require('./logRoutes'));

module.exports = router;
