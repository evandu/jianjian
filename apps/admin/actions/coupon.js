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
        coupon.Status = Coupon.Status[coupon.Status]
        coupon.CreateDate = moment(coupon.CreateDate).format('YYYY-MM-DD HH:mm:ss')
        coupon.LastUpdateDate = moment(coupon.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
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
