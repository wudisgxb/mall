var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var TenantConfigs =  sequelize.define('TenantConfigs', {
        tenantId: shortDataTypes.String(),
        //微信账号
        wecharPayee_account: {
            type: Sequelize.STRING,
        },
        //支付宝账号
        payee_account: {
            type: Sequelize.STRING,
        },
        //是否实时转账
        isRealTime:shortDataTypes.Bool(),
    }, {
        timestamps: false,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return TenantConfigs;
};

