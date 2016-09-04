/**
 * Created by evan on 2016/8/27.
 */

'use strict';


const pay = module.exports = {};


pay.payError = function*() {
    yield this.render('templates/pay-error');
};

pay.paySuccess = function*() {
    yield this.render('templates/pay-success');
};
