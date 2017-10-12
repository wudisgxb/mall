var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var Foods = sequelize.define('Foods', {

        name: shortDataTypes.String(),
        /**
         * 图片链接数组的json串
         * [url, url, url]
         */
        image: shortDataTypes.String(),
        icon: shortDataTypes.String(),
        /**
         * 现价
         */
        price: shortDataTypes.Double(),
        /**
         * 原价
         */
        todaySales: shortDataTypes.Int(),//总数量
        oldPrice: shortDataTypes.Double(),
        foodNum: shortDataTypes.Int(),
        vipPrice: shortDataTypes.Double(),
        //口味
        taste: shortDataTypes.String(255, true),
        //活动价
        activityPrice: shortDataTypes.Double(-1),

        sellCount: shortDataTypes.Int(),
        rating: shortDataTypes.Int(),


        info: shortDataTypes.String(),
        isActive: shortDataTypes.Bool(),
        unit: shortDataTypes.String(),

        integral : shortDataTypes.Int(),//积分

        //卡包ID，公众号推卡包场景用，正常不用
        cardId: shortDataTypes.String(255, true),
        tenantId: {
            type: Sequelize.STRING
        }
    }, {
        paranoid: true,
        associate: function (models) {
            // models.Menus.hasMany(models.Foods);
            // models.Foods.belongsTo(models.Menus);
        },
        getterMethods: {
            rest() {
                return (this.foodNum - this.todaySales <= 0) ? 0 : (this.foodNum - this.todaySales)
            }
        },
        classMethods: {
            upOrDown: function *(id, mode) {
                yield this.update({
                    deletedAt: mode ? null : Date.now()
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
