/**
 * Created by evan on 2016/9/4.
 */


'use strict';

const router = require('koa-router')();

const www = require('./actions/www.js');
const pay = require('./actions/pay.js');
//www
router.get('/', www.index);
router.get('/sleep/manuals', www.manuals);
router.get('/about', www.about);
router.get('/weixinAuth',www.weiXinAuth)
router.get('/weixinAuth/',www.weiXinAuth)
router.post('/weixin/pay/notify', pay.weiXinPayNotify)

router.get('/report/download/:OrderNo', www.download);

module.exports = router.middleware();
