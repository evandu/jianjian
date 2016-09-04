/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Route to handle '/' root element                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const order = require('../actions/order');
const user = require('../actions/user.js');

router.get('/', order.list);
router.get('/ajaxQuery', order.ajaxQuery);
router.get('/order/query', order.list);
router.get('/order/ajaxQuery', order.ajaxQuery);
router.get('/order/:OrderNo', order.details);
router.post('/order/orderStatusNext', order.orderStatusNext);
router.post('/order/orderCancel', order.orderCancel);


router.get('/user/modify',                user.edit);
router.post('/user/modify',               user.processEdit);


module.exports = router.middleware();

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
