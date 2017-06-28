var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var Foods = sequelize.define('Foods', {

        name:shortDataTypes.String(),
        /**
         * 图片链接数组的json串
         * [url, url, url]
         */
        image: shortDataTypes.String(),
        icon:shortDataTypes.String(),
        /**
         * 现价
         */
        price: shortDataTypes.Double(),
        /**
         * 原价
         */
        oldPrice: shortDataTypes.Double(),
        vipPrice:shortDataTypes.Double(),
        sellCount:shortDataTypes.Int(),
        rating:shortDataTypes.Int(),
        info:shortDataTypes.String(),
        isActive:shortDataTypes.Bool(),
        unit:shortDataTypes.String(),
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
            upOrDown: function *(id, mode) {
                yield this.update({
                    deletedAt: mode ?  null : Date.now()
                }, {
                    where: {
                        id: id
                    },
                    paranoid: false
                });
            },
            up: function *(id) {
                yield this.upOrDown(id, true);
            },
            down: function *(id) {
                yield this.upOrDown(id, false);
            },
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


    return Foods;
};
