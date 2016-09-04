
'use strict';

const router = require('koa-router')();

const orders = require('./actions/orders.js');
const pay = require('./actions/pay.js');
const query = require('./actions/query.js');
const report = require('./actions/report.js');

//order
router.get('/', orders.create);
router.post('/', orders.processCreate);

//query
router.get('/list', query.list);
router.get('/detail/:OrderNo', query.detail);

//pay
router.get('/pay-error', pay.payError);
router.get('/pay-success', pay.paySuccess);

//report
router.get('/report', report.report);

module.exports = router.middleware();
