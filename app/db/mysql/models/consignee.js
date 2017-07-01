var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Consignees = sequelize.define('Consignees', {
        /**
         * 代售商户名
         */
        name: shortDataTypes.String(),
        phone: shortDataTypes.Phone(),
        //微信账号
        wecharPayee_account: {
            type: Sequelize.STRING,
        },
        //支付宝账号
        payee_account: {
            type: Sequelize.STRING,
        },
        consigneeId: shortDataTypes.String(100, false),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return Consignees;
};

