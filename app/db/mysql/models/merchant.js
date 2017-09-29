var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    return sequelize.define('Merchants', {
        /**
         * 主商户名
         */
        name: shortDataTypes.String(100, false),
        phone: shortDataTypes.Phone(true),
        //商户类型
        industry: {
            type: DataTypes.STRING,
            defaultValue: '餐饮'
        },
        // //微信账号
        // wecharPayee_account: shortDataTypes.String(100,false),
        // //支付宝账号
        // payee_account: shortDataTypes.String(100,false),
        address : shortDataTypes.String(100,true),
        tenantId: shortDataTypes.String(100, false),
        //是否订单确认
        needOrderConfirmPage: shortDataTypes.Bool(),
        style : shortDataTypes.String(),
        // //是否实时
        // isRealTime:shortDataTypes.Bool(),
        aggregateScore : shortDataTypes.Int(),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
};

