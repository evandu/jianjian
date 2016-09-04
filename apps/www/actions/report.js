/**
 * Created by evan on 2016/8/27.
 */


'use strict';


const report = module.exports = {};

report.report = function*() {
    yield this.render('templates/report');
};