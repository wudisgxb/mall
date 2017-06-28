var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var foodShoppingCarts = sequelize.define('FoodShoppingCarts', {
        num: shortDataTypes.Double(),
        tableUser:shortDataTypes.String(),
        tableUserNumber: shortDataTypes.Int(),
        unit:shortDataTypes.String(),
        tenantId : {
            type: Sequelize.STRING
        },
        remark : {
            type: Sequelize.STRING
        }
    }, {
        associate: function (models) {
            models.FoodShoppingCarts.belongsTo(models.Tables);
            models.FoodShoppingCarts.belongsTo(models.Foods);
        },
        instanceMethods: {
        },
        classMethods: {

        }
    });

    return foodShoppingCarts;
};

