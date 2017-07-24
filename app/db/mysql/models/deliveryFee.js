//订单配送费
var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var DeliveryFees = sequelize.define('DeliveryFees', {
        //配送费ID
        deliveryFeeId: shortDataTypes.String(255, true),
        //订单号
        trade_no: shortDataTypes.String(255, true),
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

    return DeliveryFees;
};

