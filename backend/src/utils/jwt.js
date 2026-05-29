'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');

exports.sign = (payload) => jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
exports.verify = (token) => jwt.verify(token, config.jwtSecret);
