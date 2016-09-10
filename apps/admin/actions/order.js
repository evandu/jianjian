/**
 * Created by evan on 2016/9/3.
 */

'use strict';

const Order = require('../../../models/order');
const Report = require('../../../models/report');
const Lib = require('../../../lib/lib');
const _ = require('lodash');
const moment = require('moment');
const fs = require('fs')
const path = require('path')
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
    yield this.render('templates/details',
        {
            module: context.module,
            order: order,
            refundDepositStatusList: _.toPairs(Order.RefundDepositStatus)
        });
};


orders.orderStatusNext = function*() {
    const {OrderNo, Status} = this.request.body
    const _Status = parseInt(Status)
    if (_Status >= 1 && _Status < 7) {
        const order = yield Order.updateNextStatus(OrderNo, _Status, _Status + 1)
        if (order.affectedRows < 1) {
            throw ModelError(409, '更新报错');
        }
        this.body = order.affectedRows
    } else {
        throw ModelError(409, '更新报错');
    }
};


orders.update2Status = function*() {
    const {OrderNo, DeliverName, DeliverNum} = this.request.body
    const order = yield Order.update2Status(OrderNo, DeliverName, DeliverNum)
    if (!DeliverName || DeliverName == '') {
        this.flash = {op: {status: false, msg: '物流公司不能为空'}};
        this.redirect('/order/' + OrderNo);
    } else if (!DeliverNum || DeliverNum == '') {
        this.flash = {op: {status: false, msg: '物流单号不能为空'}};
        this.redirect('/order/' + OrderNo);
    } else {
        if (order.affectedRows < 1) {
            this.flash = {op: {status: false, msg: '设备已寄出更新报错'}};
        } else {
            this.flash = {op: {status: true, msg: '设备已寄出'}};
        }
        this.redirect('/order/' + OrderNo);
    }
};

orders.update4Status = function*() {
    const {OrderNo, RefundDeposit, RefundDepositStatus} = this.request.body
    if (!RefundDeposit || RefundDeposit == '') {
        this.flash = {op: {status: false, msg: '押金退款金额不能为空'}};
        this.redirect('/order/' + OrderNo);
    } else {
        const order = yield Order.update4Status(OrderNo, _.toInteger(RefundDeposit) * 100, RefundDepositStatus)
        if (order.affectedRows < 1) {
            this.flash = {op: {status: false, msg: '押金退款更新报错'}};
        } else {
            this.flash = {op: {status: true, msg: '押金退款'}};
        }
        this.redirect('/order/' + OrderNo);
    }
};


orders.orderCancel = function*() {
    const {OrderNo, Status} = this.request.body
    const _Status = parseInt(Status)
    if (_Status >= 1 && _Status < 7) {
        throw ModelError(409, '取消报错');
    } else {
        this.body = yield Order.updateNextStatus(OrderNo, _Status, -2)
    }
};


orders.ajaxQuery = function*() {
    const orders = yield Order.query(this.query)
    const data = _.map(orders.orders, order=> {
        order.Deposit = order.Deposit / 100.0
        order.PayServiceAmount = order.PayServiceAmount / 100.0
        order.PayDepositAmount = order.PayDepositAmount / 100.0
        order.ServicePrice = order.ServicePrice / 100.0
        order.Status = Order.Status[order.Status]
        order.RefundDepositStatus = Order.RefundDepositStatus[order.RefundDepositStatus]
        order.UserInfo = `${order.Name} ${order.Gender == '1' ? '男' : '女'} ${order.Age}岁 ${order.Height} cm ${order.Weight} kg`
        order.AddressInfo = `${order.Area} ${order.Address}`
        order.CreateDate = moment(order.CreateDate).format('YYYY-MM-DD HH:mm:ss')
        order.LastUpdateDate = moment(order.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
        return order
    })
    this.body = {data: orders}
}


orders.upload = function*() {
    const OrderNo = this.params.OrderNo
    const order = yield Order.getByOrderNo(OrderNo)
    let report;
    try {
        report = yield Report.getByOrderNo(OrderNo)
    } catch (e) {

    }
    const context = {
        module: {
            name: '订单',
            subName: '上传报告',
        },
        order: order,
        report: report
    };
    yield this.render('templates/upload', context);
};


orders.processUpload = function*() {

    const {
        OrderNo, BMI, AHI, ODI, SPO2, ApneaTimes,
        ApneaMin, ApneaMax, ApneaAvg, Suggest, ReportId
    } = this.request.body.fields
    let ReportFile;
    try {
        const item = this.request.body.files.Report;
        if (item) {
            const nameArray = item['name'].split('.');
            const ext = nameArray[nameArray.length - 1];
            const uploadPath = path.join(this.envConfig.upload, moment().format('YYYYMMDD'))
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath);
            }
            const fileUploadFilePath = path.join(uploadPath, OrderNo + "_" + moment().format('HHmmss') + "." + ext);
            var stream = fs.createWriteStream(fileUploadFilePath);
            fs.createReadStream(item['path']).pipe(stream);
            ReportFile = fileUploadFilePath.replace(this.envConfig.upload, "").replace(/\\+/g, "/")
            yield Order.updateNextStatus(OrderNo, 6, 7)
        }

        if (ReportId) {
            yield  Report.update(ReportId, {
                BMI,
                AHI,
                ODI,
                SPO2,
                ApneaTimes,
                ApneaMin,
                ApneaMax,
                ApneaAvg,
                Suggest,
                ReportFile
            })
            this.flash = {op: {status: true, msg: '上传体检报告成功'}};
        } else {
            yield  Report.insert({
                OrderNo,
                BMI,
                AHI,
                ODI,
                SPO2,
                ApneaTimes,
                ApneaMin,
                ApneaMax,
                ApneaAvg,
                Suggest,
                ReportFile
            })
            yield Order.updateNextStatus(OrderNo, 6, 7)
            this.flash = {op: {status: true, msg: '修改体检报告成功'}};
        }
    } catch (e) {
        this.flash = {op: {status: true, msg: '体检报告上传/修改报错'}};
    }
    this.redirect('/');
};

