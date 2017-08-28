var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Customers = sequelize.define('Customers', {
        phone:shortDataTypes.String(),
        tenantId:shortDataTypes.String(),
        status:shortDataTypes.Int(),
        isVip:shortDataTypes.Bool(),
        totalPrice:shortDataTypes.Double(),
        foodName:shortDataTypes.String()
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return Customers;
};

