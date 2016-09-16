/**
 * Created by evan on 2016/9/16.
 */


'use strict';
const OrderConfig = module.exports = {};

OrderConfig.Status = {
    '-2': "已取消",
    '-1': '支付失败',
    '0': "待支付",
    '1': '预定成功',
    '2': '设备已寄出',
    '3': '监测完成',
    '4': '押金退款',
    '5': '报告查看',
    '6': '专家评估',
    '7': '报告上传',
}

OrderConfig.RefundDepositStatus = {
    '0': "无需退款",
    '1': '已退款',
    '2': '未退款',
}

OrderConfig.Init = {
    'ServiceName': '睡眠监测暂停分析服务',
    'ServicePrice': 20000,
    'Deposit': 40000,
    'Status': 0,
    'PayDepositAmount': 0,
    'PayServiceAmount': 0,
    'RefundDepositStatus': 0,
    'RefundDeposit': 0,
}
