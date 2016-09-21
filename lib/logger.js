'use strict';
const bunyan = require('bunyan');

const access = {type: 'rotating-file', path: './logs/www-access.log', level: 'trace', period: '1d', count: 4};
const error = {type: 'rotating-file', path: './logs/www-error.log', level: 'error', period: '1d', count: 4};
const debug = {type: 'rotating-file', path: './logs/www-debug.log', level: 'debug', period: '1d', count: 4};

const logger = bunyan.createLogger({name: 'www', streams: [access, error,debug]});

module.exports = logger