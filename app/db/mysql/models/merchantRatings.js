var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var MerchantRatings = sequelize.define('MerchantRatings', {
        userName: shortDataTypes.String(),
        rateTime: shortDataTypes.Date(),
        //rateType: shortDataTypes.Int(),
        text: shortDataTypes.String(),
        avatar: shortDataTypes.String(),
        tenantId: {
            type: Sequelize.STRING
        },
        tasteScore: shortDataTypes.Int(),
        environmentScore: shortDataTypes.Int(),
        serviceScore: shortDataTypes.Int(),
        averageScore: shortDataTypes.Double(),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return MerchantRatings;
};

