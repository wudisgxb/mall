var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    let ClienteleIntegrals = sequelize.define('ClienteleIntegrals', {
        integralId: shortDataTypes.String(255, false),//积分id
        tenantId: shortDataTypes.String(255, false),
        phone: shortDataTypes.Phone(),//客户的电话号码
        integralnum: shortDataTypes.String(),//多少积分
        price: shortDataTypes.Double(),//购买金额
        integralTime: shortDataTypes.Date(),//积分时间
        goodsName: shortDataTypes.String(),//什么商品
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return ClienteleIntegrals;
};
