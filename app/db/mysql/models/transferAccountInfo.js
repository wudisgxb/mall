var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var TransferAccountInfos = sequelize.define('TransferAccountInfos', {

        code: shortDataTypes.String(255, true),
        msg: shortDataTypes.String(255, true),
        out_biz_no: shortDataTypes.String(255, true),
        sub_code: shortDataTypes.String(255, true),
        sub_msg: shortDataTypes.String(255, true),

        order_id: shortDataTypes.String(255, true),
        pay_date: shortDataTypes.String(255, true),
        transferAccountInfoUrl: shortDataTypes.String(255, true),
        tenantId: {
            type: Sequelize.STRING
        }

    }, {
        paranoid: true,
        associate: function (models) {
            // models.Menus.hasMany(models.Foods);
            // models.Foods.belongsTo(models.Menus);
        },
        classMethods: {},
        getterMethods: {},
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


    return TransferAccountInfos;
};
