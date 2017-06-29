const sequelizex = require('../../../lib/sequelizex');
const shortDataTypes = sequelizex.DataTypes;
const util = require('util');
const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    let ProfitSharings = sequelize.define('ProfitSharings', {
        tenantId: shortDataTypes.String(100,false),
        //主商户支付备注
        merchantRemark:shortDataTypes.String(100,false),
        //代售商户支付备注
        consigneeRemark:shortDataTypes.String(100,false),
        //代售商分成比例
        rate:shortDataTypes.Double(),
        //服务商分成比例
        ownRate:shortDataTypes.Double(),
        //配送费
        distributionFee:shortDataTypes.Double(),
        //排除食物
        excludeFoodId:shortDataTypes.String(2048,true),

    }, {
        associate: function (models) {
            models.Consignees.hasMany(models.ProfitSharings);
            models.ProfitSharings.belongsTo(models.Consignees);
        }
    });

    return ProfitSharings;
};
