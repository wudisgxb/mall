var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    return sequelize.define('ConsumeEchats', {
        /**
         * foodName:菜名
         * foodNum:当前菜品数量
         * foodPrice:菜品单价
         * foodNumPrice：菜品总价格
         * rate:分成比例
         * wonReat:拥有比例
         * ratePrice:平台服务费
         *
         * phone:手机号码
         * orderStatus:订单状态
         */
        foodName: shortDataTypes.String(100, false),
        foodNum: shortDataTypes.String(100, false),
        foodPrice: shortDataTypes.String(100, false),
        foodNumPrice: shortDataTypes.String(100, false),
        rate: shortDataTypes.String(100, false),
        wonReat: shortDataTypes.String(100, false),
        ratePrice: shortDataTypes.String(100, false),
        phone: shortDataTypes.String(100, false),
        orderStatus: shortDataTypes.String(100, false),

    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
};

