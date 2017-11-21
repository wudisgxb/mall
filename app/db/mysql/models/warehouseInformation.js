var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var WarehouseInfos = sequelize.define('WarehouseInfos', {

    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return WarehouseInfos;
};