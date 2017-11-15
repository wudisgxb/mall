var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var SupplierManages = sequelize.define('SupplierManages', {
        //供应商名称
        name : shortDataTypes.String(),
        //供应商编号  (商品的唯一编号，可以处理同种商品，不同进货价格的商品)
        supplierNumber : shortDataTypes.String(),
        //供应商属性 --零食厂商，酒水厂商
        supplierProperty: shortDataTypes.String(255,true),
        //单位电话
        phone : shortDataTypes.String(255,true),
        //负责人
        principal : shortDataTypes.String(255,true),
        //负责人电话
        principalPhone : shortDataTypes.String(255,true),
        //对应的租户
        tenantId : shortDataTypes.String(),

    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return SupplierManages;
};