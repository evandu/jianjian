/**
 * Created by evan on 2016/9/3.
 */

'use strict';

const Order = require('../../../models/order');
const _ = require('lodash');
const moment = require('moment');
const ModelError = require('../../../models/modelerror.js');

const orders = module.exports = {};

orders.list = function*() {
    const context = {
        module: {
            name: '订单',
            subName: '订单列表',
        },
    };
    yield this.render('templates/orders', {module: context.module, orderStatusList: _.toPairs(Order.Status)});
};


orders.details = function*() {
    const context = {
        module: {
            name: '订单',
            subName: '订单详情',
        },
    };
    const OrderNo = this.params.OrderNo
    const order = yield Order.getByOrderNo(OrderNo)
    yield this.render('templates/details', {module: context.module, order: order});
};


orders.orderStatusNext = function*() {
    const {OrderNo, Status} = this.request.body
    const _Status = parseInt(Status)
    if (_Status >= 1 && _Status < 7) {
        this.body =  yield Order.updateNextStatus(OrderNo, _Status, _Status + 1)
    }else{
        throw ModelError(409, '更新报错');
    }
};


orders.orderCancel = function*() {
    const {OrderNo, Status} = this.request.body
    const _Status = parseInt(Status)
    if (_Status >= 1 && _Status < 7) {
        throw ModelError(409, '取消报错');
    }else{
        this.body = yield Order.updateNextStatus(OrderNo, _Status, -2)
    }
};



orders.ajaxQuery = function*() {
    const orders = yield Order.query(this.query)
    const data = _.map(orders.orders, order=> {
        order.Deposit = order.Deposit / 100.0
        order.PayServiceAmount = order.PayServiceAmount / 100.0
        order.PayServiceAmount = order.PayServiceAmount / 100.0
        order.ServicePrice = order.ServicePrice / 100.0
        order.Status = Order.Status[order.Status]
        order.UserInfo = `${order.Name} ${order.Gender == '1' ? '男' : '女'} ${order.Age}岁 ${order.Height} cm ${order.Weight} kg`
        order.AddressInfo = `${order.Area} ${order.Address}`
        order.CreateDate = moment(order.CreateDate).format('YYYY-MM-DD HH:mm:ss')
        order.LastUpdateDate = moment(order.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
        return order
    })

    this.body = {data: orders}

}