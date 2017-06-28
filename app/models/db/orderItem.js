var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;

module.exports = function (sequelize, DataTypes) {

    var OrderItem = sequelize.define('OrderItem', {
        /**
         * goods 对象json
         */
        goods: shortDataTypes.Text(),
        price: shortDataTypes.Double(),
        num: shortDataTypes.Int(),
        type: shortDataTypes.Int(),
        tax: shortDataTypes.Double()
    }, {
        associate: function (models) {
            models.Order.hasMany(models.OrderItem);
            models.OrderItem.belongsTo(models.Order);
            models.Goods.hasMany(models.OrderItem);
            models.OrderItem.belongsTo(models.Goods);
            models.OrderItem.belongsTo(models.SalerGoods);
        },
        instanceMethods: {
        },
        classMethods: {
        }
    });

    return OrderItem;
};

