var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var vips = sequelize.define('Vips', {
        phone: shortDataTypes.Phone(),
        vipLevel:shortDataTypes.Int(),
        vipName:shortDataTypes.String(),
        tenantId : {
            type: Sequelize.STRING
        }
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {
        },
        classMethods: {

        },
        scopes: {
            all: {
                paranoid: false,
            }
        }
    });
    return vips;
};

