var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Coupons = sequelize.define('Coupons', {
        couponKey: shortDataTypes.String(),//优惠券唯一标识
        tenantId: {
            type: Sequelize.STRING
        },
        consigneeId: {
            type: Sequelize.STRING
        },
        couponRate:shortDataTypes.String(),//平台优惠券比率 0-1 1表示完全是平台优惠券，0表示商家优惠券，0.5表示平台优惠券比率
        couponType:shortDataTypes.String(),//优惠券类型
        value:shortDataTypes.String(),//金额或折扣
        status: shortDataTypes.Int(), //使用状态：0-未使用，1-已使用
        //time: shortDataTypes.Double(),//使用期限
        phone: shortDataTypes.Phone(true),//使用优惠券手机号，起始为null
        trade_no: shortDataTypes.String(255,true),//使用优惠的订单号，起始为null
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {
            

        },
        scopes: {
            all: {
                paranoid: false,
            }
        }
    });

    return Coupons;
};

