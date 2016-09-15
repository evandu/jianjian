/**
 * Created by evan on 2016/8/27.
 */
'use strict';
const HttpRequest = require('koa-request');

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
    this.log.error("wechat auth code=" +code )
    const req = {
        method: 'post',
        url: this.envConfig.weixin.getOpenId + code,
    };
    const response = yield HttpRequest(req);
    const status = response.statusCode;
    this.log.error("wechat get openId response:" +  response.body )
    if (status == 200) {

        const openId = JSON.parse(response.body).openid;
        if (openId && openId.length > 16) {
            const md5OpenId  = crypto.createHash('sha1').update(openId + this.envConfig.weixin.tokenMaskCode).digest('hex')
            this.cookies.set(this.envConfig.weixin.tokenName, md5OpenId);
            this.redirect("/");
        } else {
            throw new ModelError(500, "打开页面报错，请稍后再试")
        }
    } else {
        throw new ModelError(500, "打开页面报错，请稍后再试")
    }
}
