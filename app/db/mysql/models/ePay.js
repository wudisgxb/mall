var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var EPays = sequelize.define('EPays', {
        params: shortDataTypes.String(2048,true),
        app_id: shortDataTypes.String(255,true),
        paymentMethod: shortDataTypes.String(255,true),//支付方式，支付宝，微信
        isFinish: shortDataTypes.Bool(),//0-第一次支付，1-非第一次
        merchantName: shortDataTypes.String(255,true),//主商户名称
        totalAmount: shortDataTypes.String(255,true),//原收金额
        wechatPayeeAccount: shortDataTypes.String(255,true),//微信账号
        payeeAccount: shortDataTypes.String(255,true),//支付宝账号
        trade_no: shortDataTypes.String(255,true),//订单号
        TransferAccountIsFinish: shortDataTypes.Bool(),//主商户是否转账成功
        tenantId:shortDataTypes.String(255,true),//租户id
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {
        },
        scopes: {
            all: {
                paranoid: false,
            }
        }
    });

    return EPays;
};

