var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var TransferAccountInfos = sequelize.define('TransferAccountInfos', {

        code:shortDataTypes.String(),
        msg: shortDataTypes.String(),
        out_biz_no:shortDataTypes.String(),
        sub_code: shortDataTypes.String(),
        sub_msg:shortDataTypes.String(),

        order_id:shortDataTypes.String(),
        pay_date:shortDataTypes.String(),
        transferAccountInfoUrl:shortDataTypes.String(),
        tenantId : {
            type: Sequelize.STRING
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


    return TransferAccountInfos;
};
