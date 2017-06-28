var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var GoodsType = sequelize.define('GoodsType', {
        title: shortDataTypes.String(),
        /**
         * 一级类别，二级类别
         */
        type: shortDataTypes.Int(),
        /**
         * 拓展字段 JSON格式
         */
        fields: shortDataTypes.Text()
    }, {
        timestamps: false,
        associate: function (models) {
            models.GoodsType.hasMany(models.GoodsType);
            models.GoodsType.belongsTo(models.GoodsType, {as: 'ParentType', foreignKey: 'GoodsTypeId', constraints: false});
        },
        instanceMethods: {
        },
        classMethods: {
            all: function * () {
                return yield this.findAll({
                    where: {
                        type: 1
                    },
                    include: [this]
                });
            },
            structured: function *(options) {
                if (!options) {
                    options = {};
                }
                var conditions = util._extend(options, {
                    where: {
                        type: 1
                    },
                    attribute: ['id', 'title'],
                    include: [
                        {
                            model: this,
                            attribute: ['id', 'title']
                        }
                    ]
                });
                return yield this.findAll(conditions);
            }
        }
    });

    return GoodsType;
};

