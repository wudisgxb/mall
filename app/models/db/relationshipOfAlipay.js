var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var RelationshipOfAlipays = sequelize.define('RelationshipOfAlipays', {
        tenantId : {
            type: Sequelize.STRING
        }
    }, {
        associate: function (models) {
            models.AlipayConfigs.hasMany(models.RelationshipOfAlipays);
            models.RelationshipOfAlipays.belongsTo(models.AlipayConfigs);
            models.ChildAlipayConfigs.hasOne(models.RelationshipOfAlipays);
            models.RelationshipOfAlipays.belongsTo(models.ChildAlipayConfigs);
        }
    });

    return RelationshipOfAlipays;
};
