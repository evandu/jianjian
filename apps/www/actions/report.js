/**
 * Created by evan on 2016/8/27.
 */


'use strict';
const Order = require('../../../models/order');
const Report = require('../../../models/report');
const Lib = require('../../../lib/lib');
const path = require('path')
const report = module.exports = {};

report.report = function*() {
    const healthLabToken = this.healthLabToken;
    const OrderNo = this.params.OrderNo
    const order = yield Order.get(OrderNo,healthLabToken)
    const report = yield Report.getByOrderNo(order.OrderNo)

    yield this.render('templates/report',{order:order,report:report});
};


report.download = function* () {
    const userAgent = this.headers['user-agent']
    if(userAgent.indexOf("MicroMessenger") == -1){
        const OrderNo = this.params.OrderNo
        const report = yield Report.getByOrderNo(OrderNo)
        const nameArray = (report.ReportFile).split('.')
        const ext = nameArray[nameArray.length - 1];
        this.set('Content-disposition', 'attachment;filename=Report_' + OrderNo + "."  +  ext);
        const filePath= path.join(this.envConfig.upload, report.ReportFile);
        this.body=yield Lib.readData(filePath);
    }else{
        yield this.render('templates/404-not-found',{msg: "微信客户下无法下载文件，请在浏览器内打开此链接下载"});
    }
}
