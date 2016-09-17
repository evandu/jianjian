/**
 * Created by evan on 2016/8/28.
 */
'use strict';

const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');
const _ = require('lodash');

const Coupon = module.exports = {};

Coupon.Status = {
    '0': "未使用",
    '1': "已使用",
    '2': '已禁用',
}

Coupon.insert = function*(values) {
    try {
        const [result] = yield global.db.query('Insert Into Coupon Set ?', values);
        return result.insertId;
    } catch (e) {
        switch (e.code) {
            // recognised errors for Order.update - just use default MySQL messages for now
            case 'ER_BAD_NULL_ERROR':
            case 'ER_NO_REFERENCED_ROW_2':
            case 'ER_NO_DEFAULT_FOR_FIELD':
                throw ModelError(403, e.message); // Forbidden
            case 'ER_DUP_ENTRY':
                throw ModelError(409, e.message); // Conflict
            default:
                Lib.logException('Coupon.insert', e);
                throw ModelError(500, e.message); // Internal Server Error
        }
    }
};

Coupon.query = function*(values) {
    let sql = 'Select * From Coupon';
    let count = 'Select count(*) From Coupon';
    values = _.merge(values,{size: 10, cur: 1, PromoteCode:(values['PromoteCode'] || '').toUpperCase()});
    const data = _.filter(_.keys(values), key => (key != 'size' && key != 'cur' && values[key] != ''))
    if (data.length > 0) {
        const filter = data.map(function (q) {
            if (q == 'DateRange' && values['DateRange'].length > 0) {
                values.StartDate = values['DateRange'].split("-")[0].trim()
                values.EndDate = values['DateRange'].split("-")[1].trim()
                return 'CreateDate > :StartDate And CreateDate < :EndDate'
            } else {
                return q + ' = :' + q;
            }
        }).join(' and ');
        sql += ' Where ' + filter;
        count += ' Where ' + filter;
    }

    sql += ' Order By CreateDate DESC';
    sql += ' Limit :pageStart , :pageSize'

    let pageStart = values.size * (values.cur - 1)
    let pageSize = parseInt(values.size)
    if (pageStart < 0) {
        pageStart = 0;
    }
    if (pageSize < 0 || pageSize > 100) {
        pageSize = 10;
    }
    values.pageStart = pageStart
    values.pageSize = pageSize


    const [coupons] = yield global.db.query({sql: sql, namedPlaceholders: true}, values);

    const [[total]] = yield global.db.query({sql: count, namedPlaceholders: true}, values);

    return {
        total: total['count(*)'],
        coupons: coupons,
        size: pageSize,
        cur: parseInt(values.cur) < 1 ? 1 : parseInt(values.cur)
    }
}

Coupon.updateNextStatus = function*(PromoteCode, OrderNo, Status, NextStatus) {
    PromoteCode = PromoteCode.toUpperCase();
    const sql = 'Update Coupon Set Status=:NextStatus,OrderNo=:OrderNo  Where PromoteCode =:PromoteCode And Status = :Status';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {PromoteCode, OrderNo, Status, NextStatus});
    return orders;
}

Coupon.nextVal  = function *() {
    const  [[val]] =  yield global.db.query("select NEXTVAL('PromoteCode') as NextId")
    const maskCode = (val.NextId).toString(16).toUpperCase()
    const PromoteCode = maskCode + Lib.randomString(12 - maskCode.length).replace(/o|i|f|z|g|v/gi, 'H').toUpperCase();
    return PromoteCode.substring(0,4) + "-" + PromoteCode.substring(4,8) + "-" + PromoteCode.substring(8,12)
}

Coupon.get = function* (PromoteCode) {
    PromoteCode = PromoteCode.toUpperCase();
    const sql = 'Select * From Coupon Where PromoteCode =:PromoteCode';
    const [coupons] = yield global.db.query({sql: sql, namedPlaceholders: true}, {PromoteCode});
    if (!coupons[0]) {
        throw ModelError(404, '体检码不存在');
    }
    return coupons[0];
}
