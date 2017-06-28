var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var ChildAlipayConfigs = sequelize.define('ChildAlipayConfigs', {

        merchant:shortDataTypes.String(),
        payee_account: shortDataTypes.String(),
        payee_real_name:shortDataTypes.String(),
        remark: shortDataTypes.String(),
        rate:shortDataTypes.Double(),
        ownRate:shortDataTypes.Double(),
        tenantId : {
            type: Sequelize.STRING
        },
        excludeFoodId:shortDataTypes.String(2048,true),
        wecharPayee_account: {
            type: Sequelize.STRING,
        }
    }, {
        paranoid: true,
        associate: function (models) {
            // models.Menus.hasMany(models.Foods);
            // models.Foods.belongsTo(models.Menus);
        },
        classMethods: {
        },
        getterMethods: {

        },
        scopes: {
            deleted: {
                where: {
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false,
            },
            all: {
                paranoid: false,
            }
        }

    });


    return ChildAlipayConfigs;
};
