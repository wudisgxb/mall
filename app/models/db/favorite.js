/**
 * Created by lxc on 16-1-20.
 */
var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var Favorite = sequelize.define('Favorite', {
    }, {
        timestamps: true,
        associate: function (models) {
            models.User.hasMany(models.Favorite);
            models.Favorite.belongsTo(models.User);
            models.Store.hasMany(models.Favorite);
            models.Favorite.belongsTo(models.Store);
        },
        instanceMethods: {
        },
        classMethods: {
        }
    });

    return Favorite;
};

