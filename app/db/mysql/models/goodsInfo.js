var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var GoodsInfos = sequelize.define('GoodsInfos', {
        //商品名
        name : shortDataTypes.String(),
        //商品编号  (商品的唯一编号，可以处理同种商品，不同进货价格的商品)
        goodsNumber : shortDataTypes.String(),
        //商品属性 --零食，酒水
        property: shortDataTypes.String(255,true),
        //单位
        unit : shortDataTypes.String(),
        //单价
        unitPrice : shortDataTypes.String(),
        //备注
        info : shortDataTypes.String(),
        //商品状态-上架（1）or下架（0）
        isActive: shortDataTypes.Bool(),

        tenantId : shortDataTypes.String(),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return GoodsInfos;
};