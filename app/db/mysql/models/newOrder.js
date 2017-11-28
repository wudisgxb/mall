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
            QRCodeTemplateId: shortDataTypes.String(255, true),//二维码id，商品活动价需要用到
            deliveryTime : shortDataTypes.String(255,true),//分钟
            payTime:shortDataTypes.Date(),//下单时间
            acceptTime:shortDataTypes.Date(),//接单时间
            receiveTime:shortDataTypes.Date(),//收货时间
            orderLimit: shortDataTypes.Int(-1),//每单限购总数，建议大于单品限购，待完善

            integral : shortDataTypes.Int(),//积分

            openId: shortDataTypes.String(255, true),//微信账号
            cardId: shortDataTypes.String(255, true),//卡包ID
            cardSendResult : shortDataTypes.String(1000, true),//卡包发送结果-success；-微信返回码
            isOnlinePayment :shortDataTypes.Bool(),
        },
        {
            paranoid: true,
            associate: function (models) {
                models.NewOrders.belongsTo(models.Tables);
            },
            instanceMethods: {}
            ,
            classMethods: {}
        }
    );
    return NewOrders;
};

