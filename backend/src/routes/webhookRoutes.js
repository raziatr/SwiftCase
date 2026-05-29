'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/webhookController');

// Callback dari Xendit (tanpa rate-limit & tanpa JWT; diverifikasi via token).
router.post('/xendit', ctrl.xendit);

module.exports = router;
