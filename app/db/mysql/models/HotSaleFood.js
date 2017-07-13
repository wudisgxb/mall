var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var HotSaleFood = sequelize.define('HotSaleFood', {

        name: shortDataTypes.String(),
        type: shortDataTypes.Int(),
        sort: shortDataTypes.Int(),
        tenantId: {
            type: Sequelize.STRING
        },
        num: shortDataTypes.Int(),
        foodName:shortDataTypes.String(),
        
    }, {
        paranoid: true,
        associate: function (models) {
        },
        classMethods: {},
        getterMethods: {},
        scopes: {
            all: {
                paranoid: false,
            }
        }

    });


    return Menus;
};