/**
 * Created by evan on 2016/8/28.
 */
'use strict';

const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');
const OrderConfig = require('./orderConfig.js');
const _ = require('lodash');

const Order = module.exports = {};

Order.Status = OrderConfig.Status

Order.RefundDepositStatus = OrderConfig.RefundDepositStatus

Order.Init = OrderConfig.Init

/**
 * Creates new Order record.
 *
 * @param   {Object} values - Order details.
 * @returns {number} New Order id.
 * @throws  Error on validation or referential integrity errors.
 */
Order.insert = function*(values) {
    try {
        const [result] = yield global.db.query('Insert Into JJOrder Set ?', values);
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
                Lib.logException('Order.insert', e);
                throw ModelError(500, e.message); // Internal Server Error
        }
    }
};

Order.query = function*(values) {
    let sql = 'Select * From JJOrder';
    let count = 'Select count(*) From JJOrder';
    values = _.merge({size: 10, cur: 1}, values);
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


    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, values);

    const [[total]] = yield global.db.query({sql: count, namedPlaceholders: true}, values);

    return {
        total: total['count(*)'],
        orders: orders,
        size: pageSize,
        cur: parseInt(values.cur) < 1 ? 1 : parseInt(values.cur)
    }
}

Order.get = function*(OrderNo, OpenId) {
    const sql = 'Select * From JJOrder Where OrderNo =:OrderNo And OpenId =:OpenId';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo, OpenId});
    if (!orders[0]) {
        throw ModelError(404, '订单不存在');
    }
    return orders[0];
}

Order.getByOrderNo = function*(OrderNo) {
    const sql = 'Select * From JJOrder Where OrderNo =:OrderNo';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo});
    if (!orders[0]) {
        throw ModelError(404, '订单不存在');
    }
    return orders[0];
}

Order.updateNextStatus = function*(OrderNo, Status, NextStatus) {
    const sql = 'Update JJOrder Set Status = :NextStatus Where OrderNo =:OrderNo And Status = :Status';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo, Status, NextStatus});
    return orders;
}

Order.delete = function*(OrderNo) {
    yield global.db.query('Delete From JJOrder Where OrderNo = ?', OrderNo);
}



Order.updatePrepayId = function*(OrderNo,PrepayId) {
    const sql = 'Update JJOrder Set PrePayId = :PrepayId, PrePayDate=sysdate() Where OrderNo =:OrderNo';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo,PrepayId});
    return orders;
}


Order.paySuccess = function*(OrderNo,PayDepositAmount,PayServiceAmount,PayTransactionId,OpenId) {
    //OpenId=:OpenId And
    const sql = 'Update JJOrder Set Status = 1, PayDate=sysdate(), PayDepositAmount=:PayDepositAmount, PayServiceAmount=:PayServiceAmount, PayTransactionId=:PayTransactionId Where OrderNo =:OrderNo And Status in (-1,0) ';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo,PayDepositAmount,PayServiceAmount,PayTransactionId,OpenId});
    return orders;
}


Order.update2Status = function*(OrderNo,DeliverName,DeliverNum) {
    const sql = 'Update JJOrder Set Status = 2, DeliverName =:DeliverName, DeliverNum =:DeliverNum, DeliverDate=sysdate() Where OrderNo =:OrderNo And Status = 1';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo, DeliverName, DeliverNum});
    return orders;
}

Order.update4Status = function*(OrderNo,RefundDeposit,RefundDepositStatus) {
    const sql = 'Update JJOrder Set Status = 4, RefundDeposit =:RefundDeposit, RefundDepositStatus =:RefundDepositStatus, RefundDepositDate=sysdate() Where OrderNo =:OrderNo And Status = 3';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo, RefundDeposit, RefundDepositStatus});
    return orders;
}


Order.cancel = function*(OrderNo, OpenId) {
    const sql = 'Update JJOrder Set Status = -2  Where OrderNo =:OrderNo And OpenId = :OpenId And Status in (-1,-2,0)';
    const [orders] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo, OpenId});
    return orders;
}
