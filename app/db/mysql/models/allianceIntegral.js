var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    //商圈Id
    var AllianceIntegrals = sequelize.define('AllianceIntegrals', {
        allianceIntegralsId : shortDataTypes.String(100, false),//vip积分Id
        alliancesId: shortDataTypes.String(100, false),//vip的Id
        buyOrSale : shortDataTypes.String(100, false),//买入或者卖出0为买入1为卖出
        buyOrSaleMerchant : shortDataTypes.String(100, false),//买入卖出商
        price : shortDataTypes.String(100, false),//消费金额
        integral : shortDataTypes.String(100, false),//积分
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return AllianceIntegrals;
};

