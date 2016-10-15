/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Route to handle '/' root element                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const order = require('../actions/order');
const coupon = require('../actions/coupon');
const user = require('../actions/user.js');
const bodyParse =require('koa-body');

router.get('/', order.list);
router.get('/ajaxQuery', order.ajaxQuery);
router.get('/order/query', order.list);
router.get('/order/ajaxQuery', order.ajaxQuery);
router.get('/order/:OrderNo', order.details);
router.post('/order/update2Status', order.update2Status);
router.post('/order/update4Status', order.update4Status);
router.post('/order/updateRandomStatus', order.updateRandomStatus);
router.post('/order/orderStatusNext', order.orderStatusNext);
router.post('/order/orderCancel', order.orderCancel);
router.get('/order/upload/:OrderNo', order.upload);
router.get('/report/download/:OrderNo', order.download);
router.post('/order/upload/:OrderNo', bodyParse({multipart:true}), order.processUpload);


router.get('/coupon/query', coupon.list);
router.get('/coupon/ajaxQuery', coupon.ajaxQuery);
router.get('/coupon/generate',  coupon.generate);
router.post('/coupon/generate',  coupon.processGenerate);


router.get('/user/modify',                user.edit);
router.post('/user/modify',               user.processEdit);


module.exports = router.middleware();

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
