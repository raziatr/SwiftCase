'use strict';
const bcrypt = require('bcryptjs');
const config = require('../config');

exports.hash = (plain) => bcrypt.hashSync(plain, config.bcryptRounds);
exports.compare = (plain, hashStr) => bcrypt.compareSync(plain, hashStr);
