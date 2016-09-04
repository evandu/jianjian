/**
 * Created by evan on 2016/9/4.
 */


'use strict';

const router = require('koa-router')();

const www = require('./actions/www.js');

//www
router.get('/manuals', www.manuals);
router.get('/about', www.about);
router.get('/index', www.index);
router.get('/weixinAuth',www.weixinAuth)

module.exports = router.middleware();