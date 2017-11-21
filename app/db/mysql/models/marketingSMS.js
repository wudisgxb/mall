var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var MarketingSMSs = sequelize.define('MarketingSMSs', {
        phone: shortDataTypes.Phone(),
        date: shortDataTypes.Date(),
        smsTemplateId : shortDataTypes.String(),
        tenantId: {
            type: Sequelize.STRING
        },
        consigneeId: {
            type: Sequelize.STRING
        }
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {},

        scopes: {}
    });

    return MarketingSMSs;
};

