/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Library of assorted useful functions                                                          */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint esnext:true, node:true */
'use strict';

const Cryptiles = require('cryptiles');
const Moment = require('moment');
const _ = require('lodash');
const crypto = require('crypto')
const request = require('koa-request');
const xmlify = require('xmlify');
const xml2json = require('xml2json');
const ModelError = require('../models/modelerror.js');

const Lib = module.exports = {};

Lib.logException = function (method, e) {
    /* eslint no-console:off */
    // could eg save to log file or e-mail developer
    console.log('UNHANDLED EXCEPTION', method, e.stack === undefined ? e.message : e.stack);
};


Lib.randomString = function (length) {
    if (!length || length <= 0 || length > 64) {
        length = 16
    }
    const buffer = Cryptiles.randomBits((length + 1) * 6);
    if (buffer instanceof Error) {
        return buffer;
    }
    const string = buffer.toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').replace(/\=/g, 'C');
    return string.slice(0, length);
}




Lib.generateOrderNo = function () {
    const ts = Moment().format("YYMMDDHHmmssSSS")
    const bit = (_.reduce(_.uniq(_.toArray(ts.substring(2, 11))), (sum, n)=>sum + _.toInteger(n) + 1, 7)) % 10
    const end = _.last(_.toArray(ts))
    return ts.substr(0, end) + bit + ts.substring(end, ts.length)
}

Lib.generatePayParams = function (wechatConfig,PrePayId) {
    const payParams = {
        "appId":wechatConfig.appid,
        "timeStamp":''+new Date().getTime(),
        "package": `prepay_id=${PrePayId}`,
        "nonceStr": Lib.randomString(20),
        "signType": "MD5"
    }
    const POriginData = _.map(_.sortBy(_.keys(payParams)), o=>`${o}=${payParams[o]}`).join("&") + `&key=${wechatConfig.key}`;
    const paySign = crypto.createHash('md5').update(POriginData).digest('hex').toUpperCase();
    payParams.paySign = paySign;
    payParams.prepay_id = PrePayId;
    return payParams
}


Lib.sendOrderToWechat = function*(order1, wechatConfig, clientIp) {
    if(order1.PrePayId){
        return  Lib.generatePayParams(wechatConfig, order1.PrePayId)
    }
    const total_fee = order1.ServicePrice + order1.Deposit - order1.PromotePrice
    if(total_fee<=0){
        throw new ModelError(500, "支付的订单金额不能小于或等于0元")
    }
    const OrderData = {
        appid: wechatConfig.appid,
        openid: order1.OpenId,
        mch_id: wechatConfig.mch_id,
        device_info: "WEB",
        nonce_str: Lib.randomString(20),
        body: order1.ServiceName,
        attach: total_fee + "@" + order1.Deposit, //todo
        out_trade_no: order1.OrderNo,
        total_fee: total_fee,
        spbill_create_ip: clientIp,
        notify_url: "http://www.healthlab.com.cn/weixin/pay/notify",
        trade_type: "JSAPI"
    }
    const originData = _.map(_.sortBy(_.keys(OrderData)), o=>`${o}=${OrderData[o]}`).join("&") + `&key=${wechatConfig.key}`;
    const sign = crypto.createHash('md5').update(originData).digest('hex').toUpperCase();
    OrderData.sign = sign;
    const req = {
        method: 'post',
        url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
        body: xmlify(OrderData, {xmlDeclaration: false, root: 'xml'}),
        headers: {'Accept': 'application/xml'},
    };
    console.log("send order to wechat req data:" + JSON.stringify(req))
    const response = yield request(req);
    console.log("send order to wechat response body:" + response.body + "statusCode:" + response.statusCode)
    if (response.statusCode == 200 && response.body && response.body != '') {
        const respData = JSON.parse(xml2json.toJson(response.body, {trim: true})).xml
        if (respData.return_code == 'SUCCESS') {
            // 构建支付参数
            return  Lib.generatePayParams(wechatConfig,respData.prepay_id)
        } else {
            switch (respData.return_code) {
                case "NOTENOUGH":
                    throw new ModelError(500, "帐号余额不足，请充值或更换支付卡后再支付")
                    break;
                case "ORDERPAID":
                    throw new ModelError(500, "订单已支付，无需再次支付")
                    break;
                case "SYSTEMERROR":
                    throw new ModelError(500, "系统超时,请再试一次")
                    break;
                case "ORDERCLOSED":
                    throw new ModelError(500, "当前订单已关闭，无法支付,请重新下单")
                    break;
                case "OUT_TRADE_NO_USED":
                    throw new ModelError(600, "订单号重复")
                    break;
                default:
                    throw new ModelError(500, "微信支付下单失败，请稍后再试，错误编码：" + respData.return_code)
            }
        }
    } else {
        throw new ModelError(500, "微信支付下单失败，请稍后再试")
    }
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
