/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Library of assorted useful functions                                                          */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint esnext:true, node:true */
'use strict';

const Cryptiles = require('cryptiles');
const Lib = module.exports = {};
const Moment = require('moment');
const _ = require('lodash');

Lib.logException = function (method, e) {
    /* eslint no-console:off */
    // could eg save to log file or e-mail developer
    console.log('UNHANDLED EXCEPTION', method, e.stack === undefined ? e.message : e.stack);
};


Lib.randomString = function (length) {
    if (!length || length <= 0 || length > 64) {
        length = 16
    }
    const buffer = Cryptiles.randomBits((length + 1) * 6);
    if (buffer instanceof Error) {
        return buffer;
    }
    const string = buffer.toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').replace(/\=/g, 'C');
    return string.slice(0, length);
}

Lib.generateOrderNo = function () {
    const ts = Moment().format("YYMMDDHHmmssSSS")
    const bit = (_.reduce(_.uniq(_.toArray(ts.substring(2, 11))), (sum, n)=>sum + _.toInteger(n) + 1, 7)) % 10
    const end = _.last(_.toArray(ts))
    return ts.substr(0, end) + bit + ts.substring(end, ts.length)
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
