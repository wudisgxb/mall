var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Orders = sequelize.define('Orders', {
        num: shortDataTypes.Double(),
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return Orders;
};

