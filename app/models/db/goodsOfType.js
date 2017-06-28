var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var GoodsOfTypes = sequelize.define('GoodsOfTypes', {
    }, {
        associate: function (models) {
            models.GoodsType.hasMany(models.GoodsOfTypes);
            models.GoodsOfTypes.belongsTo(models.GoodsType);
            models.Goods.hasMany(models.GoodsOfTypes);
            models.GoodsOfTypes.belongsTo(models.Goods);
        }
    });

    return GoodsOfTypes;
};
