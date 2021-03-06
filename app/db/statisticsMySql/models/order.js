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
        // coupon : shortDataTypes.String(255,true),//优惠券类型
        // foodName : shortDataTypes.String(255,true),//菜名
        createTime : shortDataTypes.Date(255,true),//创建统计数据的时间
        style : shortDataTypes.String(255,true),
        // merchantSetIntegrals : shortDataTypes.String(255,true),//商家积分设置（新）
        // isVip : shortDataTypes.Bool(),  //是否是Vip（新）
        phone : shortDataTypes.Phone(), //如果是vip就是vip手机号，否则就是普通的手机号
        constPrice : shortDataTypes.String(255,true),//进价
        // alliancesId : shortDataTypes.String(255,true),//会员所属的商圈Id如果非会员就是商家所属的商圈Id（新）
        // integrals:shortDataTypes.String(255,true),//当前商品的积分如果不是会员的话就算商品有积分，也获得不到积分（新）
        // vipName : shortDataTypes.String(255,true),//vip名字，若是购买者不是会员，那么vipName就为null(新)

    }, {
        paranoid: true,
        associate: function (models) {
        },
        instanceMethods: {
            
        },
        classMethods: {


            getTotalPriceByTenantId: async function (tenantId) {
                const allOrders = await Orders.findAll({
                    where: {
                        tenantId: tenantId
                    }
                })

                let result = []
                for (const order of allOrders) {

                    const totalPrice = Number(order.totalPrice)
                    if (totalPrice>10) {
                        result.push(order)
                    }
                }
                return result
            },
            getBetweenDateByTenantId: async function (tenantId, startDate, endDate) {
                // console.log(666666666666)
                const allOrders = await Orders.findAll({
                    where: {
                        tenantId: tenantId
                    }
                })
                // console.log(555555555555)
                let result = []
                for (const order of allOrders) {
                    const createTime = new Date(order.createdAt)
                    if (startDate.getTime() < createTime.getTime() && createTime.getTime() < endDate.getTime()) {

                        result.push(order)
                    }
                }
                // console.log(777777777777)
                // console.log(result)
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

