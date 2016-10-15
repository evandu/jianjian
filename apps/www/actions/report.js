/**
 * Created by evan on 2016/8/27.
 */


'use strict';
const Order = require('../../../models/order');
const Report = require('../../../models/report');

const report = module.exports = {};

report.report = function*() {
    const healthLabToken = this.healthLabToken;
    const OrderNo = this.params.OrderNo
    const order = yield Order.get(OrderNo,healthLabToken)
    const report = yield Report.getByOrderNo(order.OrderNo)

    yield this.render('templates/report',{order:order,report:report});
};
