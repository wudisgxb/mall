var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var TenantConfigs = sequelize.define('TenantConfigs', {
        tenantId: shortDataTypes.String(),
        //主商户名称
        name: shortDataTypes.String(),
        //微信账号
        wecharPayee_account: {
            type: Sequelize.STRING,
        },
        //支付宝账号
        payee_account: {
            type: Sequelize.STRING,
        },
        //公众号推送，openId数组
        openIds: {
            type: Sequelize.STRING,
        },
        //是否实时转账
        isRealTime: shortDataTypes.Bool(),
        //是否需要VIP
        needVip: shortDataTypes.Bool(),
        //满多少送会员
        vipFee: shortDataTypes.Double(100000),
        //快满多少提示会员
        vipRemindFee: shortDataTypes.Double(100000),
        //主页图
        homeImage: shortDataTypes.String(),

        //订单购物车超时时间
        invaildTime: shortDataTypes.Double(),

        //经度
        longitude: {
            type: Sequelize.STRING,
            defaultValue: ""
        },

        //纬度
        latitude: {
            type: Sequelize.STRING,
            defaultValue: ""
        },

        //公告
        officialNews: {
            type: Sequelize.STRING,
            defaultValue: ""
        },

        //是否选择人数
        needChoosePeopleNumberPage: shortDataTypes.Bool(),

        //首单折扣（半价）
        firstDiscount: shortDataTypes.Double(-1),

        //是否开通-false不开通，true-开通
        openFlag: shortDataTypes.Bool(),

        //营业起始时间
        startTime: shortDataTypes.String(),
        //营业结束时间
        endTime: shortDataTypes.String(),
        isProfitRate : shortDataTypes.Bool(),
        //商家与平台的利润分成
        profitRate : shortDataTypes.String(),
        //商家给平台的比率
        rate : shortDataTypes.String(),
        //酒店配送的开始时间
        deliveryStartTime : shortDataTypes.String(),
        //酒店配送的结束时间
        deliveryEndTime : shortDataTypes.String(),
        //二维码类型（生成一个二维码，或者生成很多二维码）
        // qrCodeType : shortDataTypes.String(),
        needChoosePayMode : shortDataTypes.String(),
        //超出服務時間段的提示
        outOfServiceTimePrompt : shortDataTypes.String()
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return TenantConfigs;
};
