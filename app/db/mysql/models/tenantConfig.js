var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var TenantConfigs = sequelize.define('TenantConfigs', {
        tenantId: shortDataTypes.String(),
        //主商户名称
        name: shortDataTypes.String(),
        //微信账号
        wecharPayee_account: {
            type: Sequelize.STRING,
        },
        //支付宝账号
        payee_account: {
            type: Sequelize.STRING,
        },
        //是否实时转账
        isRealTime: shortDataTypes.Bool(),
        //是否需要VIP
        needVip:shortDataTypes.Bool(),
        //满多少送会员
        vipFee: shortDataTypes.Double(100000),
        //快满多少提示会员
        vipRemindFee: shortDataTypes.Double(100000),
        //主页图
        homeImage: shortDataTypes.String(),
        //营业起始时间
        startTime: shortDataTypes.String(),
        //营业结束时间
        endTime: shortDataTypes.String(),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return TenantConfigs;
};

