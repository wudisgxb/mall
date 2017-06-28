var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;

module.exports = function (sequelize, DataTypes) {

    var ShoppingCart = sequelize.define('ShoppingCart', {
        num: shortDataTypes.Int(),
        /**
         * 0 => 普通商品
         * 1 => 分销商品
         */
        type: shortDataTypes.Int(),
    }, {
        associate: function (models) {
            models.User.hasMany(models.ShoppingCart);
            models.ShoppingCart.belongsTo(models.User);
            models.ShoppingCart.belongsTo(models.Goods);
            models.ShoppingCart.belongsTo(models.SalerGoods);
        },
        instanceMethods: {
        },
        classMethods: {
            buildConditionWithType: (goodsId, userId, type) => {
                var condition = {
                    where: {
                        UserId: userId,
                        type: type
                    }
                };
                if (type == 0) {
                    condition.where.GoodId = goodsId;
                } else {
                    condition.where.SalerGoodId = goodsId;

                }
                return condition;
            },
            num: function *(goodsId, userId, type) {
                return yield this.count(this.buildConditionWithType(goodsId, userId, type));
            },
            findOneWithType: function *(id, userId, type) {
                return yield this.findOne(this.buildConditionWithType(id, userId, type));
            },
            getGoodWithType: function *(id, type) {
                if (type == 0) {
                    return yield sequelize.models.Goods.findById(id);
                } else {
                    var salerGoods = yield sequelize.models.findById(id);
                    if (!salerGoods ) {
                        return null;
                    }
                    return yield salerGoods.getGood();
                }
            },
            createWithType: function *(id, userId, type, num) {
                var params = this.buildConditionWithType(id, userId, type).where;
                params.num = num;
                return yield this.create(params);
            }
        }
    });

    return ShoppingCart;
};

