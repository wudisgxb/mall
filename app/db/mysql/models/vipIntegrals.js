var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    //商户积分
    var VipIntegrals = sequelize.define('VipIntegrals', {
        vipIntegralsId : shortDataTypes.String(100, false),//vip积分Id
        allianceId : shortDataTypes.String(100, false),//商圈Id
        vipId: shortDataTypes.String(100, false),//vip的Id
        buyOrSale : shortDataTypes.String(100, false),//买入或者卖出0为买入1为卖出
        buyOrSaleMerchant : shortDataTypes.String(100, false),//买入卖出商
        price : shortDataTypes.String(100, false),//消费金额
        integral : shortDataTypes.String(100, false),//积分
        trade_noId : shortDataTypes.String(100, true),//订单号Id(就是订单号)
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return VipIntegrals;
};
