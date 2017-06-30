var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var ShoppingCarts = sequelize.define('ShoppingCarts', {
        num: shortDataTypes.Double(),
        tableUser:shortDataTypes.String(),
        tableUserNumber: shortDataTypes.Int(),
        unit:shortDataTypes.String(),
        phone:shortDataTypes.Phone(true),
        tenantId : {
            type: Sequelize.STRING
        },
        consigneeId: shortDataTypes.Int(0),
        remark : {
            type: Sequelize.STRING
        }
    }, {
        paranoid: true,
        associate: function (models) {
            models.ShoppingCarts.belongsTo(models.Tables);
            models.ShoppingCarts.belongsTo(models.Foods);
        },
        instanceMethods: {
        },
        classMethods: {

        }
    });

    return ShoppingCarts;
};

