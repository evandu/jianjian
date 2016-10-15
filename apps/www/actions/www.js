/**
 * Created by evan on 2016/8/27.
 */
'use strict';
const HttpRequest = require('koa-request');

const ModelError = require('../../../models/modelerror.js');
const crypto = require('crypto')
const logger = require('../../../lib/logger')

const Lib = require('../../../lib/lib');
const path = require('path')
const Report = require('../../../models/report');
const Order = require('../../../models/order');

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

www.weiXinPayNotify = function*() {
    console.log(this.request.body)
}

www.weiXinAuth = function*() {
    const {code}  = this.query
    logger.debug("wechat auth code=" + code)
    if (!code || code.length < 10) {
        throw new ModelError(403, "请在微信客户端下打开")
    }
    const req = {
        method: 'post',
        url: this.envConfig.weixin.getOpenId + code,
    };
    const response = yield HttpRequest(req);
    const status = response.statusCode;
    logger.debug("wechat get openId response:" + response.body)
    if (status == 200) {
        const openId = JSON.parse(response.body).openid;
        if (openId && openId.length > 16) {
            this.cookies.set(this.envConfig.weixin.tokenName, openId);
            const nextUrl = this.cookies.get("nextUrl");
            this.redirect(nextUrl ? nextUrl : "/sleep");
        } else {
            throw new ModelError(500, "打开页面报错，请稍后再试")
        }
    } else {
        throw new ModelError(500, "打开页面报错，请稍后再试")
    }
}

www.download = function* () {
    const userAgent = this.headers['user-agent']
    if(userAgent.indexOf("MicroMessenger") == -1){
        const OrderNo = this.params.OrderNo
        const sign = this.query.sign
        const report = yield Report.getByOrderNo(OrderNo)
        const order = yield Order.getByOrderNo(OrderNo)
        if(sign == crypto.createHash('sha1').update(order.OpenId).digest('hex')){
            const nameArray = (report.ReportFile).split('.')
            const ext = nameArray[nameArray.length - 1];
            this.set('Content-disposition', 'attachment;filename=Report_' + OrderNo + "."  +  ext);
            this.set('Content-Type', 'application/octet-stream');
            const filePath= path.join(this.envConfig.upload, report.ReportFile);
            this.body=yield Lib.readData(filePath);
        }else{
            yield this.render('templates/404-not-found',{msg: " 报告不存在"});
        }
    }else{
        yield this.render('templates/404-not-found',{msg: "微信客户下无法下载文件，请在浏览器内打开此链接下载"});
    }
}
