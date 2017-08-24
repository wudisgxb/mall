var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Customer = sequelize.define('Customer', {
        phone:shortDataTypes.String(255, false),
        tenantId:shortDataTypes.String(255,false),
        status:shortDataTypes.Int(10,false),
        numPrice:shortDataTypes.Double,
        totalPrice:shortDataTypes.String(),
        foodName:shortDataTypes.String(),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return Customer;
};

