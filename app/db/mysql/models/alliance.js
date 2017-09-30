var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    return sequelize.define('Alliances', {
        //产业
        industry: shortDataTypes.String(),
        //名字
        name: shortDataTypes.String(),
        //联盟Id
        alliancesId: shortDataTypes.String(),
        //电话
        phone: shortDataTypes.Phone(),
        //地址
        address : shortDataTypes.String(255,true),
        //微信号
        wecharPayee_account : shortDataTypes.String(),
        //支付宝账号
        payee_account : shortDataTypes.String(),
        //经度
        longitude: shortDataTypes.String(),
        //纬度
        latitude : shortDataTypes.String(),
        //公告
        officialNews : shortDataTypes.String(255,true),
        //主页图
        homeImage : shortDataTypes.String(),
        //总积分
        aggregateScore : shortDataTypes.String(),
    }, {
        paranoid: true,
        associate: function (models) {
        },
        classMethods: {},
        getterMethods: {},
        scopes: {
            all: {
                paranoid: false,
            }
        }
    });
};

