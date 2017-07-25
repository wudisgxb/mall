var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Orders = sequelize.define('Orders', {
        tenantId:shortDataTypes.String(255,true),
        consigneeId:shortDataTypes.String(255,true),
        trade_no: shortDataTypes.String(255,true), //转给商户的钱
        totalPrice: shortDataTypes.String(255,true), //订单价格
        merchantAmount: shortDataTypes.String(255,true), //转给商户的钱
        consigneeAmount: shortDataTypes.String(255,true), //转给代售的钱
        platformAmount: shortDataTypes.String(255,true), //转给平台的钱
        deliveryFee: shortDataTypes.String(255,true), //配送费
        refund_amount: shortDataTypes.String(255,true), //退款
        platformCouponFee: shortDataTypes.String(255,true), //平台优惠
        merchantCouponFee: shortDataTypes.String(255,true), //商家优惠
        phone: shortDataTypes.Phone(), //手机号
        
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return Orders;
};

