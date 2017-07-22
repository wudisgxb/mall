var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    return sequelize.define('ConsumeEchats', {
        /**
         * ：订单数量
         *tenantId:商家信息
         * costPrice:原价
         * vipPrice：会员价
         * isVip：是否是会员
         * createdAt：创建时间
         */
        num: shortDataTypes.String(100, false),
        tenantId: shortDataTypes.Phone(true),
        //商户类型
        industry: {
            type: DataTypes.STRING,
            defaultValue: '餐饮'
        },
        // //微信账号
        // wecharPayee_account: shortDataTypes.String(100,false),
        // //支付宝账号
        // payee_account: shortDataTypes.String(100,false),
        tenantId: shortDataTypes.String(100, false),
        //是否订单确认
        needOrderConfirmPage: shortDataTypes.Bool(),
        // //是否实时
        // isRealTime:shortDataTypes.Bool(),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
};

