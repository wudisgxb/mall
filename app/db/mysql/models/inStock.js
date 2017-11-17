var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var InStocks = sequelize.define('InStocks', {
        //商品名
        name : shortDataTypes.String(),
        //商品编号  (商品的唯一编号，可以处理同种商品，不同进货价格的商品)
        goodsNumber : shortDataTypes.String(),
        //商品属性 --零食，酒水
        property: shortDataTypes.String(255,true),
        //数量
        num  : shortDataTypes.String(),
        //单位
        unit : shortDataTypes.String(),
        //单价
        unitPrice : shortDataTypes.String(),
        //负责人
        // personInCharge : shortDataTypes.String(255,true),
        //进货时间
        // time : shortDataTypes.Date(),
        //备注
        // info : shortDataTypes.String(),
        //总价
        // totalPrice : shortDataTypes.String(),
        //商品状态-待入库or入库
        status : shortDataTypes.String(),
        //批次
        batch : shortDataTypes.String(),
        //入库数量
        storageNum : shortDataTypes.Int(),

        tenantId : shortDataTypes.String(),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return InStocks;
};