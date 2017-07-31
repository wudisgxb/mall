var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Orders = sequelize.define('Orders', {
        tenantId:shortDataTypes.String(255,true),//商户
        // consigneeId:shortDataTypes.String(255,true),//代售点
        trade_no : shortDataTypes.String(255,true), //订单号
        totalPrice : shortDataTypes.String(255,true), //订单价格
        merchantAmount : shortDataTypes.String(255,true), //转给商户的钱
        consigneeAmount : shortDataTypes.String(255,true), //转给代售的钱
        platformAmount : shortDataTypes.String(255,true), //转给平台的钱
        deliveryFee : shortDataTypes.String(255,true), //配送费
        refund_amount : shortDataTypes.String(255,true), //退款
        platformCouponFee : shortDataTypes.String(255,true), //平台优惠
        merchantCouponFee : shortDataTypes.String(255,true), //商家优惠
        phone : shortDataTypes.Phone(), //手机号
        createTime : shortDataTypes.Date(255,true),//创建统计数据的时间
        
    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {
            
        },
        classMethods: {
            getBetweenDateByTenantId: async function (tenantId, startDate, endDate) {
                const allOrders = await Orders.findAll({
                    where: {
                        tenantId: tenantId
                    }
                })
                let result = []
                for (const order of allOrders) {
                    const createTime = new Date(order.createTime)
                    if (startDate.getTime() < createTime.getTime() && createTime.getTime() < endDate.getTime()) {
                        result.push(order)
                    }
                }
                return result
            },
            sumField:  function (orders, field) {
               // const orders = await Orders.getBetweenDateByTenantId(tenantId, startDate, endDate)
                let result = 0
                for (const order of orders) {
                    result += Number(order[field])
                }
                return Number(result.toFixed(2))
            }
        }
    });

    return Orders;
};

