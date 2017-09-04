var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var TransferAccounts = sequelize.define('TransferAccounts', {
        trade_no:shortDataTypes.String(255, true), //订单号
        status: shortDataTypes.Int(1),//转账状态，0-未转，1-已转
        paymentMethod: shortDataTypes.String(255, true), //转账方式，微信or支付宝
        remark: shortDataTypes.String(255, true), //转账信息
        amount: shortDataTypes.String(255, true),//转账金额
        payee_account: shortDataTypes.String(255, true),//账号
        role: shortDataTypes.String(255, true),//角色，租户or代售
        pay_date: shortDataTypes.String(255, true),//转账日期 开始为空，转成功回写
        tenantId: shortDataTypes.String(255, true),
        consigneeId: shortDataTypes.String(255, true),
    }, {
        paranoid: true,
        associate: function (models) {
        },
        classMethods: {},
        getterMethods: {},
        scopes: {
            deleted: {
                where: {
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false,
            },
            all: {
                paranoid: false,
            }
        }

    });


    return TransferAccounts;
};
