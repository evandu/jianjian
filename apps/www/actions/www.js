/**
 * Created by evan on 2016/8/27.
 */
'use strict';
const HttpRequest = require('koa-request');
const weiXinConfig = require('../weixin.json');
const ModelError = require('../../../models/modelerror.js');
const crypto = require('crypto')

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

www.weiXinAuth = function*() {
    const {code}  = this.query
    const req = {
        method: 'post',
        url: weiXinConfig.weixin.getOpenId + code,
    };
    const response = yield HttpRequest(req);
    const status = response.statusCode;
    if (status == 200) {
        const openId = response.body.openid;
        if (openId && openId.length > 16) {
            const md5OpenId  = crypto.createHash('md5').update(openId + weiXinConfig.weixin.tokenMaskCode).digest('hex')
            this.cookies.set(weiXinConfig.weixin.tokenName,md5OpenId  );
            this.redirect("/");
        } else {
            throw new ModelError(500, "打开页面报错，请稍后再试")
        }
    } else {
        throw new ModelError(500, "打开页面报错，请稍后再试")
    }
}
