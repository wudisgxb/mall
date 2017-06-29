var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var tables = sequelize.define('Tables', {
        name: shortDataTypes.String(),
        status: shortDataTypes.Int(),
        info: shortDataTypes.String(),
        tenantId: {
            type: Sequelize.STRING
        }
    }, {
        associate: function (models) {
            models.Consignees.hasMany(models.Tables);
            models.Tables.belongsTo(models.Consignees);
        },
        instanceMethods: {},
        classMethods: {},

        scopes: {
            all: {
                paranoid: false,
            }
        }
    });

    return tables;
};

