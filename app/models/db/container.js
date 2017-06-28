var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var Container = sequelize.define('Container', {
        key: shortDataTypes.String(),
        value: shortDataTypes.String(),
        status: shortDataTypes.Int()
    }, {
        associate: function (models) {
        },
        instanceMethods: {
        },
        classMethods: {
            key: function *(key, value, isJson) {
                var data;
                if(util.isNullOrUndefined(value)) {
                    data =  yield this.findOne({
                        where: {
                            key
                        }
                    });
                    return util.isNullOrUndefined(data) ? null :  (isJson ? JSON.parse(data.value) : data.value);
                } else {
                    data = yield this.findOne({
                        where: {
                            key
                        }
                    });
                    if (util.isNullOrUndefined(data)) {
                        return yield this.create({
                            key,
                            value: (isJson ? JSON.stringify(value) : value)
                        });
                    } else {
                        data.value = (isJson ? JSON.stringify(value) : value);
                        return yield data.save();
                    }
                }
            },
            ///未付款订单自动过期时间(分钟)
            overduetime: function *(value) {
               return yield this.key('overduetime', value);
            },
            ///未付款订单自动过期时间(天)
            autoaccepttime: function *(value) {
                return yield this.key('autoaccepttime', value);
            },
            ///extend允许用户延长收货时间(天)
            extendaccepttime: function *(value) {
                return yield this.key('extendaccepttime', value);
            }
        }
    });

    return Container;
};

