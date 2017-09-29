var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var MerchantSetIntegrals = sequelize.define('MerchantSetIntegrals', {
        /**
         * 主商户名
         */
        tenantId: shortDataTypes.String(100, false),//租户
        vipLevel : shortDataTypes.String(100, false),//会员等级
        priceIntegralsRate: shortDataTypes.String(100, false),//每一积分对应的价格
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return MerchantSetIntegrals;
};

