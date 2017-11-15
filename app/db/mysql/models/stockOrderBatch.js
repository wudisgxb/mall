var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');



module.exports = function (sequelize, DataTypes) {

    var StockOrderBatchs = sequelize.define('StockOrderBatchs', {
        //租户Id
        tenantId : shortDataTypes.String(),
        //订单批次  (商品订单的唯一编号，可以处理同种商品，不同订单的商品)
        batch : shortDataTypes.String(),
        //状态
        status : shortDataTypes.String(),
        //负责人
        personInCharge : shortDataTypes.String(255,true),
        //备注
        info : shortDataTypes.String(255,true),
        //总订单价格
        totalPrice : shortDataTypes.Double(),
        //供应商
        supplierId : shortDataTypes.String(),
        //优惠金额
        discountsPrice : shortDataTypes.Double(),
        //其他金额
        restPrice : shortDataTypes.Double(),
        //需要支付金额
        paymentPrice : shortDataTypes.Double(),
        //以支付金额
        alreadyPaymentPrice : shortDataTypes.Double(),
        //待支付金额
        nonPaymentPrice : shortDataTypes.Double(),
        //生成订单时间
        orderTime : shortDataTypes.Date()
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return StockOrderBatchs;
};