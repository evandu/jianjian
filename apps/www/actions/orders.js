/**
 * Created by evan on 2016/8/27.
 */


'use strict';

const Order = require('../../../models/order');
const Lib = require('../../../lib/lib');
const ModelError = require('../../../models/modelerror.js');
const orders = module.exports = {};

orders.create = function*() {
    yield this.render('templates/order');
};

orders.processCreate = function*() {
    const {
        Name, Gender, Age, Height, Weight, BornDate,
        Area, Address, Mobile, PromoteCode, Email
    } = this.request.body
    let formError;
    if (!Name) {
        formError = {msg: "姓名不能为空"}
    } else if (!Gender) {
        formError = {msg: "性别不能为空"}
    } else if (!Age) {
        formError = {msg: "年龄不能为空"}
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

    if (formError) {
        this.body = formError;
        this.status = 400;
    } else {
        const healthLabToken = this.healthLabToken;
        const OrderNo = Lib.generateOrderNo()
        const OrderData = {
            Name, Gender, Age, Height, Weight,
            BornDate, Area, Address, Mobile, PromoteCode, Email,
            OrderNo: OrderNo,
            OpenId: healthLabToken,
            CreateDate: new Date()
        }
        const id = yield Order.insert(OrderData);
        try {
            const wechatResp = yield Lib.sendOrderToWechat(OrderData, this.envConfig.weixin, this.request.headers['x-forwarded-for'])
            const wechatRespUpdate = yield Order.updatePrepayId(OrderNo, wechatResp.prepay_id)
            if (wechatRespUpdate.affectedRows < 1) {
                throw ModelError(409, "微信支付下单失败，请稍后再试");
            }
            this.body = wechatResp
        } catch (e) {
            console.log(e)
            this.status=500
            yield Order.delete(OrderNo)
            this.body = {msg: e.msg||"微信支付下单失败，请稍后再试"}
        }
    }
}
