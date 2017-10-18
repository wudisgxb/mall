var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    //商户积分
    var MerchantIntegrals = sequelize.define('MerchantIntegrals', {
        merchantIntegralsId : shortDataTypes.String(100, false),
        tenantId: shortDataTypes.String(100, false),//租户
        buyOrSale : shortDataTypes.String(100, false),//买入或者卖出
        buyOrSaleMerchant : shortDataTypes.String(100, false),//买入卖出商
        price : shortDataTypes.String(100, false),
        integral : shortDataTypes.String(100, false),
        trade_noId : shortDataTypes.String(100, true),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return MerchantIntegrals;
};

