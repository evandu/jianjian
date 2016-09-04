/**
 * Created by evan on 2016/8/27.
 */


'use strict';

const Order = require('../../../models/order');

const query = module.exports = {};

query.list = function*() {
    const jianJianOpenId1 = this.jianJianOpenId1
    const orders = yield Order.query({OpenId: jianJianOpenId1})
    yield this.render('templates/list', {orders: orders.orders,hasData:orders.orders.length});
};

query.detail = function*() {
    const OrderNo = this.params.OrderNo
    const jianJianOpenId1 = this.jianJianOpenId1
    const order = yield Order.get(OrderNo, jianJianOpenId1)
    yield this.render('templates/list-detail', order);
};
