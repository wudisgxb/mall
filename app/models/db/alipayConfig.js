var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var AlipayConfigs = sequelize.define('AlipayConfigs', {

        merchant:shortDataTypes.String(),
        payee_account: shortDataTypes.String(),
        payee_real_name:shortDataTypes.String(),
        remark: shortDataTypes.String(),
        isRealTime:shortDataTypes.Bool(),
        tenantId : {
            type: Sequelize.STRING
        },
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


    return AlipayConfigs;
};
