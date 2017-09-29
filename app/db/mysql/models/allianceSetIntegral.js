var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    //商圈Id
    var AllianceSetIntegrals = sequelize.define('AllianceSetIntegrals', {
        alliancesId: shortDataTypes.String(100, false),
        priceIntegralsRate : shortDataTypes.String(100, false),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return AllianceSetIntegrals;
};

