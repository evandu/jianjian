/**
 * Created by evan on 2016/8/27.
 */

'use strict';
const crypto = require('crypto')
const xml2json = require('xml2json');
const Order = require('../../../models/order');
const pay = module.exports = {};


pay.payError = function*() {
    yield this.render('templates/pay-error');
};

pay.paySuccess = function*() {
    yield this.render('templates/pay-success');
};


pay.weiXinPayNotify = function*() {
    console.log("wechatPay Notify data = ")
    console.log(this.request.text)
    console.log(this.request.body)
   
    console.log(this.request.query)
  
    console.log(this.request.params)
    const respData = JSON.parse(xml2json.toJson(this.response.body, {trim: true})).xml
    if (respData && respData.return_code == 'SUCCESS' && respData.result_code == 'SUCCESS') {
        const wechatConfig = this.envConfig.weixin;
        const originData = _.map(_.sortBy(_.keys(respData)), o=>respData[o] ? `${o}=${respData[o]}` : '').join("&") + `&key=${wechatConfig.key}`;
        const sign = crypto.createHash('md5').update(originData).digest('hex').toUpperCase();
        if (sign == respData.sign) {
            const ServicePrice = parseInt(respData.attach.split("@")[0])
            const Deposit = parseInt(respData.attach.split("@")[1])
            const row = Order.paySuccess(respData.out_trade_no, Deposit, ServicePrice, respData.transaction_id, respData.OpenId)
            if (row.affectedRows > 0) {
                this.body = '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
            } else {
                console.log("wechatPay Notify fail Update row <1")
                this.body = "<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>"
                this.status = 500
            }
        } else {
            console.log("wechatPay Notify fail sign:" + sign + "respData.sign:" + respData.sign)
            this.body = "<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名不正确]]></return_msg></xml>"
            this.status = 500
        }
    } else {
        console.log("wechatPay Notify fail")
        this.body = "<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付通知操作失败失败]]></return_msg></xml>"
        this.status = 500
    }
}
