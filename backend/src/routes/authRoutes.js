'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');

router.post('/register', authLimiter, ctrl.registerCustomer);
router.post('/login', authLimiter, ctrl.loginCustomer);
router.post('/admin/login', authLimiter, ctrl.loginAdmin);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
