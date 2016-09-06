/**
 * Created by evan on 2016/8/27.
 */


'use strict';

const Order = require('../../../models/order');
const Lib = require('../../../lib/lib');
const HttpRequest = require('koa-request');
const xmlify = require('xmlify');
const orders = module.exports = {};


orders.create = function*() {
    yield this.render('templates/order');
};

orders.processCreate = function*() {
    const {
        Name, Gender, Age, Height, Weight, BornDate,
        Area, Address, Mobile, PromoteCode, Email
    } = this.request.body
    let formError;
    if (!Name) {
        formError = {msg: "姓名不能为空"}
    } else if (!Gender) {
        formError = {msg: "性别不能为空"}
    } else if (!Age) {
        formError = {msg: "年龄不能为空"}
    } else if (!Height) {
        formError = {msg: "身高不能为空"}
    } else if (!Address) {
        formError = {msg: "地址不能为空"}
    } else if (!Weight) {
        formError = {msg: "体重不能为空"}
    } else if (!BornDate) {
        formError = {msg: "出生日期不能为空"}
    } else if (!Area) {
        formError = {msg: "区域不能为空"}
    } else if (!Mobile) {
        formError = {msg: "手机号不能为空"}
    }

    if (formError) {
        this.body = formError;
        this.status = 400;
    } else {
        const healthLabToken = this.healthLabToken;
        const id = yield Order.insert(
            {
                Name, Gender, Age, Height, Weight,
                BornDate, Area, Address, Mobile, PromoteCode, Email,
                OrderNo: Lib.generateOrderNo(),
                OpenId: healthLabToken
            });
        this.body = {OrderId: id}
    }
}

orders.weixinPay = function*(order) {
    yield this.render('templates/weixin-pay');
    const req = {
        method: 'post',
        url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
        body: this.body,
        headers: {'Accept': 'application/xml'},
    };
    const response = yield HttpRequest(req);

    this.status = response.statusCode;
    this.text = response.text;
    this.body = xmlify(response.body, 'xml');
}

