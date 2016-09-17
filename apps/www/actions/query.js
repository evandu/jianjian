/**
 * Created by evan on 2016/8/27.
 */


'use strict';

const Order = require('../../../models/order');
const Coupon = require('../../../models/coupon');
const ModelError = require('../../../models/modelerror');

const query = module.exports = {};

query.list = function*() {
    const healthLabToken = this.healthLabToken
    const orders = yield Order.query({OpenId: healthLabToken})
    yield this.render('templates/list', {orders: orders.orders,hasData:orders.orders.length});
};

query.detail = function*() {
    const OrderNo = this.params.OrderNo
    const healthLabToken = this.healthLabToken
    const order = yield Order.get(OrderNo, healthLabToken)
    yield this.render('templates/list-detail', order);
};


query.getCoupon = function*() {
    const PromoteCode = this.params.PromoteCode
    const coupon = yield Coupon.get(PromoteCode)
    if (coupon.Status == 0) {
        if (coupon.StartDate.getTime() < Date.now() && coupon.EndDate.getTime() > Date.now()) {
            this.body = coupon
        } else {
            throw ModelError(409, "体检码不在使用有效期内");
        }
    } else if (coupon.Status == 1) {
        throw ModelError(409, "体检码已使用");
    } else if (coupon.Status == 2) {
        throw ModelError(409, "体检码已禁用");
    }
};