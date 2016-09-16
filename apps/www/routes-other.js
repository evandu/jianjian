/**
 * Created by evan on 2016/9/4.
 */


'use strict';

const router = require('koa-router')();

const www = require('./actions/www.js');
const pay = require('./actions/pay.js');
const bodyParse =require('koa-body');
//www
router.get('/manuals', www.manuals);
router.get('/about', www.about);
router.get('/index', www.index);
router.get('/weixinAuth',www.weiXinAuth)
router.get('/weixinAuth/',www.weiXinAuth)
router.post('/weixin/pay/notify', bodyParse(), pay.weiXinPayNotify)

module.exports = router.middleware();
