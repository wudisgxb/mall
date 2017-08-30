var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Consignees = sequelize.define('Consignees', {
        /**
         * 代售商户名
         */
        tenantId : shortDataTypes.String(),
        name : shortDataTypes.String(),
        phone : shortDataTypes.Phone(),
        //微信账号
        wecharPayee_account: {
            type: Sequelize.STRING,
        },
        //支付宝账号
        payee_account: {
            type: Sequelize.STRING,
        },
        //经度
        longitude: {
            type: Sequelize.STRING,
            defaultValue: ""
        },

        //纬度
        latitude: {
            type: Sequelize.STRING,
            defaultValue: ""
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

