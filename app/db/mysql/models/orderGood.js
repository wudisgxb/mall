var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var OrderGoods = sequelize.define('OrderGoods', {
            num: shortDataTypes.Double(),
            unit: shortDataTypes.String(),//单位
            trade_no: shortDataTypes.String(),//支付宝或微信订单号
            consigneeId: shortDataTypes.String(255, true),
            tenantId: shortDataTypes.String(255, true),
        },
        {
            paranoid: true,
            associate: function (models) {
                models.OrderGoods.belongsTo(models.Foods);
            }

            ,
            instanceMethods: {}
            ,
            classMethods: {}
        }
        )
        ;

    return OrderGoods;
};

