var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var CouponLimits = sequelize.define('CouponLimits', {
        couponLimitKey: shortDataTypes.String(),//优惠券限制唯一标识,暂时不用
        tenantId: {
            type: Sequelize.STRING
        },
        consigneeId: {
            type: Sequelize.STRING
        },
        timeLimit:shortDataTypes.Double(),//领用时间使用限制，比如一天后不让扫了，预留，觉得可能是前台去判断
        numLimit:shortDataTypes.Int(),//领用次数限制
        invalidTime:shortDataTypes.Double(),//领用后失效时间限制
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {},
        scopes: {
            all: {
                paranoid: false,
            }
        }
    });

    return CouponLimits;
};

