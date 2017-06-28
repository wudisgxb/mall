/**
 * Created by lxc on 16-1-12.
 */
var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var Store = sequelize.define('Store', {

        username: shortDataTypes.String(),

        name: shortDataTypes.String(),//店铺名称

        phone: shortDataTypes.Phone(true),

        //0未审核
        //1通过
        status:shortDataTypes.Int(),

        //店铺是否显示

        sales:shortDataTypes.Double(),//分销总金额

        money:shortDataTypes.Double(),//佣金

        totalMoney: shortDataTypes.Double(), //累计佣金,

        checkTime: shortDataTypes.Date(null),

        inferiorNum: shortDataTypes.Int()

    }, {
        timestamps: true,
        paranoid: true,
        associate: function (models) {
            models.User.hasOne(models.Store);
            models.Store.belongsTo(models.User);
            models.Store.hasMany(models.Store);
            models.Store.belongsTo(models.Store, {as: 'TopStore', foreignKey: 'StoreId', constraints: false});
        },
        instanceMethods: {

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

    return Store;
};
