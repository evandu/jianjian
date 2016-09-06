/**
 * Created by evan on 2016/9/7.
 */
const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');
const _ = require('lodash');

const Report = module.exports = {};

Report.insert = function*(values) {
    try {
        const [result] = yield global.db.query('Insert Into JJReport Set ?', values);
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

Report.update = function*(ReportId, values) {
    try {
        const [result] = yield global.db.query('Update JJReport Set ? Where ReportId = ?', [values,ReportId]);
        return result.insertId;
    } catch (e) {
        switch (e.code) {
            case 'ER_BAD_NULL_ERROR':
            case 'ER_NO_REFERENCED_ROW_2':
            case 'ER_NO_DEFAULT_FOR_FIELD':
                throw ModelError(403, e.message);
            case 'ER_DUP_ENTRY':
                throw ModelError(409, e.message);
            default:
                Lib.logException('Order.insert', e);
                throw ModelError(500, e.message);
        }
    }
};


Report.getByOrderNo = function*(OrderNo) {
    const sql = 'Select * From JJReport Where OrderNo =:OrderNo';
    const [report] = yield global.db.query({sql: sql, namedPlaceholders: true}, {OrderNo});
    if (!report[0]) {
        throw ModelError(404, '报告不存在');
    }
    return report[0];
}