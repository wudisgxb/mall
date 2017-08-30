var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var GoodsPromotions = sequelize.define('GoodsPromotions', {
        //二维码模板ID
        QRCodeTemplateId: shortDataTypes.String(255, true),
        tenantId: shortDataTypes.String(),
        goodsId: shortDataTypes.String(255, true),
        goodsName: shortDataTypes.String(255, true),
        //活动状态，0-失效，1-生效
        status: shortDataTypes.Int(),
        //门店新用户专享 all-所有人，new-新用户
        target: shortDataTypes.String(255, true),
        //原价
        originalPrice: shortDataTypes.Double(),
        //打折扣
        discount: shortDataTypes.String(255, true),
        //活动价
        activityPrice: shortDataTypes.Double(-1),
        //平台优惠券比率 0-1 1表示完全是平台优惠券，0表示商家优惠券，0.5表示平台优惠券比率,默认0
        couponRate: shortDataTypes.String(255, true),
        //每单限购,-1不限制
        purchaseLimit: shortDataTypes.Int(-1),
        //当日活动库存,-1无限-待做
        dayStock: shortDataTypes.Int(-1),
        //当日剩余可购买数-待做
        daySurplus: shortDataTypes.Int(-1),
        //周期循环,1-7的数组，星期-待做
        cycle: shortDataTypes.String(255, true),
        //活动起始时间
        startTime: shortDataTypes.String(255, true),
        //活动结束时间
        endTime: shortDataTypes.String(255, true),
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return GoodsPromotions;
};