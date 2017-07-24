//配送费 距离价格表
var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var DistanceAndPrices = sequelize.define('DistanceAndPrices', {
        //唯一标识
        deliveryFeeId: shortDataTypes.String(255, true),

        //最小距离
        minDistance: shortDataTypes.Double(),
        //最大距离
        maxDistance: shortDataTypes.Double(),

        //配送费
        deliveryFee: shortDataTypes.String(255, true),

        //起送费
        startPrice: shortDataTypes.String(255, true),

        //配送时间
        deliveryTime: shortDataTypes.String(255, true),

        tenantId: shortDataTypes.String(255, true),

    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {},
        scopes: {
            all: {
                paranoid: false,
            }
        }
    });

    return DistanceAndPrices;
};

