var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var vips = sequelize.define('Vips', {
        phone: shortDataTypes.Phone(),//会员电话
        vipLevel:shortDataTypes.Int(),//会员等级
        // vipName:shortDataTypes.String(),//会员名字
        // isTest : shortDataTypes.Bool(),//
        birthday : shortDataTypes.String(),//会员生日
        name : shortDataTypes.String(),//会员真实名字
        referral : shortDataTypes.String(),//推荐人名字
        referralPhone : shortDataTypes.String(),//推荐人电话
        aggregateScore : shortDataTypes.String(),//总积分
        tenantId : {
            type: Sequelize.STRING
        },//租户Id
        membershipCardNumber : shortDataTypes.Int(9),//会员卡号
        alliancesId:shortDataTypes.String()//商圈Id
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {
        },
        classMethods: {},
        scopes: {
            all: {
                paranoid: false,
            }
        }
    });

    return vips;
};

