var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var WareHouseManages = sequelize.define('WareHouseManages', {
        //商品名字
        name: shortDataTypes.String(),
        //商品编号  (商品的唯一编号，可以处理同种商品，不同进货价格的商品)
        goodsNumber : shortDataTypes.String(),
        //仓库编号（新）
        // wareHouseNumber : shortDataTypes.String(),
        //商品属性 --零食，酒水
        property: shortDataTypes.String(),
        //商品规格 --多少克--多少斤
        //specification : shortDataTypes.String(),
        //商品单位 --袋，根，个
        unit: shortDataTypes.String(),
        //商品数量(进货商品的数量)
        goodsNum: shortDataTypes.String(),
        //库存数量(出货剩余数量)
        inventoryNum: shortDataTypes.String(),
        //商品进货价(单价)
        constPrice: shortDataTypes.String(255,true),
        //进货到那个租户
        tenantId : shortDataTypes.String(),
        //库存预警
        stockNumNotice : shortDataTypes.String(255,true),
        // //进货的商家
        // stockMerchant : shortDataTypes.String(),
        //备注
        info : shortDataTypes.String(255,true),
        //支付方式.--现金，支付宝，微信
        //paymentMethod : shortDataTypes.String(),
        // //总金额=实际支付金额+其他费用-优惠金额
        // totalPrice : shortDataTypes.String(),
        // //实际支付金额
        // realPrice : shortDataTypes.String(),
        // //其他费用（包含快递费--运输费--）
        // restPrice : shortDataTypes.String(),
        // //优惠金额
        // couponPrice : shortDataTypes.String(),
        //商品状态
        //goodStatus : shortDataTypes.String(),
        //进货时间
        //stockTime : shortDataTypes.Date(),

    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return WareHouseManages;
};

