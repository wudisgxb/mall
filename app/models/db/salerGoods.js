var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var SalerGoods = sequelize.define('SalerGoods', {
        status: shortDataTypes.Int()
    }, {
        paranoid: true,
        associate: function (models) {
            models.SalerGoods.belongsTo(models.Goods);
            models.SalerGoods.belongsTo(models.Store);
            models.Store.hasMany(models.SalerGoods);
        }
    });

    return SalerGoods;
};

