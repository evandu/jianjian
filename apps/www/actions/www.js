/**
 * Created by evan on 2016/8/27.
 */
'use strict';
const HttpRequest = require('koa-request');
const weixinConfig = require('../weixin.json');
const ModelError = require('../../../models/modelerror.js');

const www = module.exports = {};

www.about = function*() {
    yield this.render('templates/about');
};

www.manuals = function*() {
    yield this.render('templates/manuals');
};

www.index = function*() {
    yield this.render('templates/index');
};

www.weixinAuth = function*() {
    const {code}  = this.query
    const req = {
        method: 'post',
        url: weixinConfig.weixin.getOpenId + code,
    };
    const response = yield HttpRequest(req);
    const status = response.statusCode;
    if (status == 200) {
        const openId = response.body.openid;
        if (openId && openId.length > 16) {
            this.cookies.set('jianJianOpenId1', openId);
            this.redirect("/");
        } else {
            throw new ModelError(500, "打开页面报错，请稍后再试")
        }
    } else {
        throw new ModelError(500, "打开页面报错，请稍后再试")
    }
}
