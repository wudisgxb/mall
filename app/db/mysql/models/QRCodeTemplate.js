var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var QRCodeTemplates = sequelize.define('QRCodeTemplates', {
        //二维码模板ID
        QRCodeTemplateId: shortDataTypes.String(255, true),
        bizType: shortDataTypes.String(255, true),
        tableName: shortDataTypes.String(255, true),
        //优惠券类型 amount discount reduce
        couponType: shortDataTypes.String(255, true),
        //优惠券值 5 0.8 20-5
        couponValue: shortDataTypes.String(255, true),
        //平台优惠券比率 0-1 1表示完全是平台优惠券，0表示商家优惠券，0.5表示平台优惠券比率
        couponRate: shortDataTypes.String(255, true),

        tenantId: shortDataTypes.String(255, true),
        consigneeId: shortDataTypes.String(255, true),
        //预留字段
        reserve1: shortDataTypes.String(255, true),
        reserve2: shortDataTypes.String(255, true),
        reserve3: shortDataTypes.String(255, true),
        reserve4: shortDataTypes.String(255, true),
        reserve5: shortDataTypes.String(255, true),
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

    return QRCodeTemplates;
};

