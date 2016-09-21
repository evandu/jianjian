/**
 * Created by evan on 2016/8/27.
 */

'use strict';
const crypto = require('crypto')
const xml2json = require('xml2json');
const Order = require('../../../models/order');
const logger = require('../../../lib/logger')
const pay = module.exports = {};
const _ = require('lodash');

pay.payError = function*() {
    yield this.render('templates/pay-error');
};

pay.paySuccess = function*() {
    yield this.render('templates/pay-success');
};


pay.weiXinPayNotify = function*() {
    logger.debug("wechatPay Notify data = " , this.request.body)
    const respData = JSON.parse(xml2json.toJson(this.request.body, {trim: true})).xml
    logger.debug("微信支付回调参数", respData)
    if (respData && respData.return_code == 'SUCCESS' && respData.result_code == 'SUCCESS') {
        const wechatConfig = this.envConfig.weixin;
        const originData = _.map(_.sortBy(_.filter(_.keys(respData),o=> o!='sign')), o=>respData[o] ? `${o}=${respData[o]}` : '').join("&") + `&key=${wechatConfig.key}`;
        const sign = crypto.createHash('md5').update(originData).digest('hex').toUpperCase();
        if (sign == respData.sign) {
            const ServicePrice = parseInt(respData.attach.split("@")[0])
            const Deposit = parseInt(respData.attach.split("@")[1])
            const row = yield Order.paySuccess(respData.out_trade_no, Deposit, ServicePrice, respData.transaction_id, respData.openid)
            if (row.affectedRows > 0) {
                logger.debug("支付通知操作成功" , respData )
                this.body = '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
            } else {
                logger.error("wechatPay Notify fail Update row <1 订单不存在")
                this.body = "<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>"
                this.status = 500
            }
        } else {
            logger.error("wechatPay Notify fail  签名不正确 sign:" + sign + "respData.sign:" + respData.sign)
            this.body = "<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名不正确]]></return_msg></xml>"
            this.status = 500
        }
    } else {
        logger.error("wechatPay Notify fail 支付通知操作失败")
        this.body = "<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付通知操作失败]]></return_msg></xml>"
        this.status = 500
    }
}
