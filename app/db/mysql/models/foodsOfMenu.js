var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var FoodsOfTMenus = sequelize.define('FoodsOfTMenus', {
        tenantId: {
            type: Sequelize.STRING
        }
    }, {
        associate: function (models) {
            models.Menus.hasMany(models.FoodsOfTMenus);
            models.FoodsOfTMenus.belongsTo(models.Menus);
            models.Foods.hasMany(models.FoodsOfTMenus);
            models.FoodsOfTMenus.belongsTo(models.Foods);
        }
    });

    return FoodsOfTMenus;
};
