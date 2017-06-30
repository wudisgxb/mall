var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Orders = sequelize.define('Orders', {
        num: shortDataTypes.Double(),
        status: shortDataTypes.Int(),
        info: shortDataTypes.String(),
        phone: shortDataTypes.Phone(),
        diners_num: shortDataTypes.Int(),
        trade_no: shortDataTypes.String(),//支付宝或微信订单号
        paymentMethod: {
            type: Sequelize.STRING
        },//支付方式，支付宝，微信
        own_trade_no: shortDataTypes.String(),//商家自己的订单号,
        consignee: shortDataTypes.String(2048, true),
        unit: shortDataTypes.String(),
        tenantId: {
            type: Sequelize.STRING
        }
    }, {
        paranoid: true,
        associate: function (models) {
            models.Orders.belongsTo(models.Tables);
            models.Orders.belongsTo(models.Foods);
        },
        instanceMethods: {},
        classMethods: {}
    });

    return Orders;
};

