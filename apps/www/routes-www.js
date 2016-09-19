
'use strict';

const router = require('koa-router')();

const orders = require('./actions/orders.js');
const pay = require('./actions/pay.js');
const query = require('./actions/query.js');
const report = require('./actions/report.js');

//order
router.get('/sleep', orders.create);
router.post('/sleep', orders.processCreate);
router.post('/cancel/:OrderNo', orders.cancel);
router.post('/pay/:OrderNo', orders.pay);

//query
router.get('/list', query.list);
router.get('/coupon/:PromoteCode', query.getCoupon);
router.get('/detail/:OrderNo', query.detail);

//pay
router.get('/pay-error', pay.payError);
router.get('/pay-success', pay.paySuccess);

//report
router.get('/report/:OrderNo', report.report);

module.exports = router.middleware();
