/**
 * Created by evan on 2016/8/27.
 */


'use strict';

const Order = require('../../../models/order');

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


