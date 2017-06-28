var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Menus = sequelize.define('Menus', {

        name:shortDataTypes.String(),
        type: shortDataTypes.Int(),
        tenantId : {
            type: Sequelize.STRING
        }
    }, {
        paranoid: true,
        associate: function (models) {
        },
        classMethods: {

        },
        getterMethods: {

        },
        scopes: {
            all: {
                paranoid: false,
            }
        }

    });


    return Menus;
};
