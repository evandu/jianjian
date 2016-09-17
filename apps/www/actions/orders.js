/**
 * Created by evan on 2016/8/27.
 */


'use strict';

const Moment = require('moment');
const Order = require('../../../models/order');
const Coupon = require('../../../models/coupon');
const Lib = require('../../../lib/lib');
const ModelError = require('../../../models/modelerror.js');
const _ = require('lodash');
const orders = module.exports = {};

orders.create = function*() {
    yield this.render('templates/order', {
        ServicePrice: Order.Init.ServicePrice,
        Deposit: Order.Init.Deposit
    });
};

orders.processCreate = function*() {
    const {
        Name, Gender, Height, Weight, BornDate,
        Area, Address, Mobile, PromoteCode, Email
    } = this.request.body
    let formError;
    if (!Name) {
        formError = {msg: "姓名不能为空"}
    } else if (!Gender) {
        formError = {msg: "性别不能为空"}
    } else if (!BornDate) {
        formError = {msg: "出生年月不能为空"}
    } else if (!Height) {
        formError = {msg: "身高不能为空"}
    } else if (!Address) {
        formError = {msg: "地址不能为空"}
    } else if (!Weight) {
        formError = {msg: "体重不能为空"}
    } else if (!Area) {
        formError = {msg: "区域不能为空"}
    } else if (!Mobile) {
        formError = {msg: "手机号不能为空"}
    }

    const Age = (Moment(BornDate, "YYYY/MM/DD").fromNow()).split(" ")[0]

    if (formError) {
        this.body = formError;
        this.status = 400;
    } else {
        const healthLabToken = this.healthLabToken;
        const OrderNo = Lib.generateOrderNo()
        let PromotePrice = 0;
        if (PromoteCode) {
            const coupon = yield Coupon.get(PromoteCode)
            if (coupon.Status == 0) {
                if (coupon.StartDate.getTime() < Date.now() && coupon.EndDate.getTime() > Date.now()) {
                    PromotePrice = coupon.Amount;
                    const couponRow = yield Coupon.updateNextStatus(PromoteCode, OrderNo, 0, 1);
                    if (couponRow.affectedRows < 1) {
                        throw ModelError(409, "体检码不存在");
                    }
                } else {
                    throw ModelError(409, "体检码不在使用有效期内");
                }
            } else if (coupon.Status == 1) {
                throw ModelError(409, "体检码已使用");
            } else if (coupon.Status == 2) {
                throw ModelError(409, "体检码已禁用");
            }
        }

        const OrderData = {
            Name, Gender, Age, Height, Weight,
            BornDate, Area, Address, Mobile,
            PromoteCode, Email, PromotePrice,
            OrderNo: OrderNo, OpenId: healthLabToken,
            CreateDate: new Date()
        }

        const BookOrder = _.merge({}, OrderData, Order.Init)
        yield Order.insert(BookOrder);
        const total_fee = BookOrder.ServicePrice + BookOrder.Deposit - BookOrder.PromotePrice

        if (total_fee <= 0) {
            yield Order.paySuccess(OrderNo, 0, 0, "PromoteCodePay", BookOrder.OpenId)
            this.body = {PromoteCodePay: 'ok'}
        } else {
            try {
                console.log("create Order Success,wehat start.....")
                const clientIp = this.request.headers['x-forwarded-for']
                const wechatConfig = this.envConfig.weixin;
                const wechatResp = yield Lib.sendOrderToWechat(BookOrder, wechatConfig, clientIp)
                const wechatRespUpdate = yield Order.updatePrepayId(OrderNo, wechatResp.prepay_id)

                if (wechatRespUpdate.affectedRows < 1) {
                    throw ModelError(409, "微信支付下单失败，请稍后再试");
                }

                console.log("wechat pay params" + JSON.stringify(wechatResp))
                this.body = wechatResp
            } catch (e) {
                console.log(e)
                this.status = 500
                yield Order.delete(OrderNo)
                if(PromoteCode && PromotePrice >0){
                    yield Coupon.updateNextStatus(PromoteCode, 1, 0)
                }
                this.body = {msg: e.msg || "微信支付下单失败，请稍后再试"}
            }
        }
    }
};

orders.cancel = function*() {
    const OrderNo = this.params.OrderNo
    const healthLabToken = this.healthLabToken
    const order = yield Order.cancel(OrderNo, healthLabToken)
    if (order.affectedRows < 1) {
        this.body = "取消失败"
        this.status = 500;
    } else {
        // 如果使用了优惠券 取消订单时 返还优惠券
        const bookOrder = yield Order.get(OrderNo, healthLabToken)
        if(bookOrder && bookOrder.PromoteCode){
            yield Coupon.updateNextStatus(bookOrder.PromoteCode, 1, 0)
        }
        this.body = "取消成功"
    }
};


orders.pay = function*() {
    const OrderNo = this.params.OrderNo
    const healthLabToken = this.healthLabToken
    const order = yield Order.get(OrderNo, healthLabToken)
    const clientIp = this.request.headers['x-forwarded-for']
    const weixinConfig = this.envConfig.weixin;
    const wechatResp = yield Lib.sendOrderToWechat(order, weixinConfig, clientIp)
    this.body = wechatResp
}
