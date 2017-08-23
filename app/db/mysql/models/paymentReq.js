var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var PaymentReqs = sequelize.define('PaymentReqs', {

        params: shortDataTypes.String(),

        tableId: shortDataTypes.Int(),
        paymentMethod: {
            type: Sequelize.STRING
        },//支付方式，支付宝，微信
        isFinish: shortDataTypes.Bool(),//0-第一次支付，1-非第一次
        isInvalid: shortDataTypes.Bool(),//是否超时失效10min写死
        trade_no: shortDataTypes.String(),
        wechat_trade_no: shortDataTypes.String(255,true),
        app_id: shortDataTypes.String(),
        total_amount: shortDataTypes.String(),//原收金额
        actual_amount: shortDataTypes.String(),//实收金额
        refund_amount: shortDataTypes.String(),//退款金额
        refund_reason: shortDataTypes.String(),//退款原因
        consigneeId: shortDataTypes.String(255,true),//代售商户Id
        phoneNumber: shortDataTypes.Phone(true),//手机号，代售用，点餐不填
        TransferAccountIsFinish: shortDataTypes.Bool(),//主商户是否转账成功
        consigneeTransferAccountIsFinish: shortDataTypes.Bool(),//代售商户是否转账完成
        //首单折扣
        firstDiscount: shortDataTypes.Double(-1),
        //是否首单
        firstOrder :shortDataTypes.Bool(),
        
        tenantId: {
            type: Sequelize.STRING
        }
    }, {
        paranoid: true,
        associate: function (models) {
        },
        classMethods: {
            upOrDown: function *(id, mode) {
                yield this.update({
                    deletedAt: mode ? null : Date.now()
                }, {
                    where: {
                        id: id
                    },
                    paranoid: false
                });
            },
            up: function *(id) {
                yield this.upOrDown(id, true);
            },
            down: function *(id) {
                yield this.upOrDown(id, false);
            },
        },
        getterMethods: {},
        scopes: {
            deleted: {
                where: {
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false,
            },
            all: {
                paranoid: false,
            }
        }
    });


    return PaymentReqs;
};
