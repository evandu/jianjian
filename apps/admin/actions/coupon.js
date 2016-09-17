/**
 * Created by evan on 2016/9/8.
 */
'use strict';

const Lib = require('../../../lib/lib');
const Coupon = require('../../../models/coupon');
const _ = require('lodash');
const moment = require('moment');
const ModelError = require('../../../models/modelerror.js');

const coupons = module.exports = {};

coupons.list = function*() {
    const context = {
        module: {
            name: '体检码',
            subName: '体检码列表',
        },
    };
    yield this.render('templates/coupons', {module: context.module, couponStatusList: _.toPairs(Coupon.Status)});
};


coupons.ajaxQuery = function*() {
    const coupons = yield Coupon.query(this.query)
    const data = _.map(coupons.coupons, coupon=> {
        coupon.Status         = Coupon.Status[coupon.Status]
        coupon.Amount         = coupon.Amount/100.00
        coupon.DateRange      = moment(coupon.StartDate).format('YYYY/MM/DD') + "-" + moment(coupon.EndDate).format('YYYY/MM/DD')
        coupon.CreateDate     = moment(coupon.CreateDate).format('YYYY/MM/DD HH:mm:ss')
        coupon.LastUpdateDate = moment(coupon.LastUpdateDate).format('YYYY/MM/DD HH:mm:ss')
        return coupon
    })
    this.body = {data: coupons}
}


coupons.generate = function*() {
    const context = {
        module: {
            name: '体检码',
            subName: '生成体检码',
        },
    };
    yield this.render('templates/generate', {module: context.module});
};

coupons.processGenerate = function*() {
    const {Amount, Num, DateRange} = this.request.body
    const couponSet = new Array();
    for (let i = 0; i < _.toInteger(Num); i++) {
        const c = {
            PromoteCode: yield Coupon.nextVal(),
            Amount: _.toInteger(Amount) * 100,
            StartDate: DateRange.split("-")[0].trim(),
            EndDate: DateRange.split("-")[1].trim()
        }
        couponSet.push(c)
        yield Coupon.insert(c)
    }
    const fileName = "promoteCodes" + DateRange.replace(/\//g, "") + ".txt"
    this.set('Content-disposition', 'attachment;filename=' + fileName)
    this.body = _.map(couponSet, o=> `${o.PromoteCode}   ${o.Amount / 100.00}元   ${o.StartDate}-${o.EndDate}`).join("\n")
};
