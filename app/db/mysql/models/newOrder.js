var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var NewOrders = sequelize.define('NewOrders', {
            status: shortDataTypes.Int(),
            info: shortDataTypes.String(),
            phone: shortDataTypes.Phone(),
            diners_num: shortDataTypes.Int(1),
            trade_no: shortDataTypes.String(),//支付宝或微信订单号
            consigneeId: shortDataTypes.String(255, true),
            tenantId: shortDataTypes.String(255, true),
            bizType : shortDataTypes.String(255, true),//类型为deal点餐，eshop代售
            deliveryTime : shortDataTypes.Int(),//以毫秒的形式输出
        },
        {
            paranoid: true,
            associate: function (models) {
                models.NewOrders.belongsTo(models.Tables);
            }

            ,
            instanceMethods: {}
            ,
            classMethods: {}
        }
        )
        ;

    return NewOrders;
};

