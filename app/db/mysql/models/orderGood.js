var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var OrderGoods = sequelize.define('OrderGoods', {
            num: shortDataTypes.Double(),
            unit: shortDataTypes.String(),//单位
            trade_no: shortDataTypes.String(),//支付宝或微信订单号
            goodsName: shortDataTypes.String(255, true),//商品名称
            price: shortDataTypes.Double(),//原价
            vipPrice: shortDataTypes.Double(),//会员价
            activityPrice: shortDataTypes.Double(-1),//活动价，如果没有活动-1，不为-1就算活动价
            purchaseLimit: shortDataTypes.Int(-1),//每单限购,-1不限制
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

