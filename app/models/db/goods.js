var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var Goods = sequelize.define('Goods', {
        title: shortDataTypes.String(100),
        /**
         * 主图
         */
        mainImg: shortDataTypes.String(),
        /**
         * 图片链接数组的json串
         * [url, url, url]
         */
        imgs: shortDataTypes.String(),
        /**
         * 现价
         */
        price: shortDataTypes.Double(),
        /**
         * 原价
         */
        oldPrice: shortDataTypes.Double(),
        baseSoldNum: shortDataTypes.Int(0),
        /**
         * 已售数量
         */
        soldNum: shortDataTypes.Int(),
        compoundSoldNum: shortDataTypes.Int(),
        /**
         * 稅率
         */
        taxRate: shortDataTypes.Double(),
        /**
         * 每人限购
         */
        buyLimit: shortDataTypes.Int(),
        /**
         *
         */
        //vipDiscount: shortDataTypes.Double(10),
        /**
         * 剩余量
         */
        capacity: shortDataTypes.Int(),
        content: {
            type: DataTypes.TEXT
        },
        /**
         * -1 已删除
         * 0 下架
         * 1 已上架
         */
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        /**
         * 定时下架
         */
        timeToDown: shortDataTypes.Date(),
        /**
         * 赠送积分
         */
        integral: shortDataTypes.Double(),
        /**
         * 分级佣金
         */
        commission1: shortDataTypes.Double(),
        commission2: shortDataTypes.Double(),
        commission3: shortDataTypes.Double(),
        /**
         * 扩展属性值
         */
        extraFields: shortDataTypes.Text(),

    }, {
        paranoid: true,
        associate: function (models) {
        },
        classMethods: {
            /**
             *
             */
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
            remove: function *(id) {

                var models = sequelize.models;
                var salerGoodsIds = (yield models.SalerGoods.findAll({
                    where: {
                        GoodId: id
                    },
                    attribute: [
                        'id'
                    ]
                })).map((item) => item.id);
                var condition = {
                    where: {
                        $or: [
                            { GoodId: id},
                            {
                                SalerGoodId: {
                                    $in: salerGoodsIds
                                }
                            }
                        ]
                    }
                };
                yield models.ShoppingCart.destroy(condition);
                yield models.GoodsCollection.destroy(condition);
                yield models.GoodsOfTypes.destroy({
                    where: { GoodId: id}
                });
                yield this.destroy({
                    where: {
                        id: id
                    },
                    paranoid: false,
                    force: true
                });

            }
        },
        getterMethods: {
            compoundSoldNum:()  => {
                return this.baseSoldNum + this.soldNum;
            }
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


    return Goods;
};
