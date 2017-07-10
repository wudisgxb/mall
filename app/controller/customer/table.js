const db = require('../../db/mysql/index');
const Tables = db.models.Tables;
const ShoppingCarts = db.models.ShoppingCarts;
const Orders = db.models.Orders;
const Vips = db.models.Vips;
const ApiResult = require('../../db/mongo/ApiResult')
const coupon = require('./coupon')

module.exports = {
    async getUserDealTable (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        
        //查询vip
        let vips = await Vips.findAll({
            where: {
                phone: ctx.query.phoneNumber,
                tenantId: ctx.query.tenantId
            }
        })
        let isVip = false;
        if (vips.length > 0) {
            isVip = true;
        }

        let table = await Tables.findOne({
            where: {
                name: ctx.query.tableName,
                tenantId: ctx.query.tenantId,
                consigneeId:null
            }
        })
        if (table != null) {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
                tableStatus:table.status,
                isVip : isVip
            })
        } else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "桌号不存在!")
        }
    },

    async getUserEshopTable (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let table = await Tables.findOne({
            where: {
                name: ctx.query.tableName,
                tenantId: ctx.query.tenantId,
                consigneeId:ctx.query.consigneeId
            }
        })
        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "桌号不存在!")
            return;
        } else {
            //查询vip
            let vips = await Vips.findAll({
                where: {
                    phone: ctx.query.phoneNumber,
                    tenantId: ctx.query.tenantId
                }
            })
            let isVip = false;
            if (vips.length > 0) {
                isVip = true;
            }

            //查看可用优惠券
            let isCouponAvailable = false;
            if (ctx.query.couponKey != null) {
                isCouponAvailable = await coupon.getCoupon(ctx.query.tenantId,ctx.query.consigneeId,ctx.query.couponKey);
            }

            //判断是否购物车状态
            let shoppingCarts = await ShoppingCarts.findAll({
                where: {
                    phone: ctx.query.phoneNumber,
                    tenantId: ctx.query.tenantId,
                    TableId: table.id
                }
            });

            if (shoppingCarts.length > 0) {
                ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
                    tableStatus:1,
                    isVip:isVip,
                    isCouponAvailable:isCouponAvailable
                });
                return;
            } else {
                //判断是否订单状态
                let orders = await Orders.findAll({
                    where: {
                        phone: ctx.query.phoneNumber,
                        tenantId: ctx.query.tenantId,
                        TableId: table.id,
                        $or:[{status:0},{status:1}]
                    }
                });
                //下单状态
                if (orders.length > 0) {
                    ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
                        tableStatus:2,
                        isVip:isVip,
                        isCouponAvailable:isCouponAvailable
                    });
                } else {
                    //空桌
                    ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {
                        tableStatus:0,
                        isVip:isVip,
                        isCouponAvailable:isCouponAvailable
                    });
                }
            }
        }
    },


}