var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Headquarters = sequelize.define('Headquarters', {
        name: shortDataTypes.String(),//名字
        headquartersId: shortDataTypes.String(),//总部Id
        phone : shortDataTypes.Phone(),//电话
        industry : shortDataTypes.String(),//产业
        address : shortDataTypes.String(255,true),//地址
        wecharPayee_account : shortDataTypes.String(),//微信号
        payee_account : shortDataTypes.String(),//支付宝账号
        homeImage : shortDataTypes.String(),//主页图
        longitude : shortDataTypes.String(),//经度
        latitude : shortDataTypes.String(),//纬度
        officialNews : shortDataTypes.String(255,true),//公告
        aggregateScore : shortDataTypes.Int(),//总积分
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
    return Headquarters;
};
