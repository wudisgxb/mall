const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/statisticsMySql/index');
let Order = db.models.Orders
let dbv3 = require('../../db/Mysql/index')

let orderStatistic = require('../statistics/orderStatistic')

module.exports = {
    async getOrderStatistic (ctx, next) {
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('startTime').notEmpty()
        ctx.checkBody('endTime').notEmpty()
        ctx.checkBody('type').notEmpty()
        ctx.checkBody('status').notEmpty()
        let body = ctx.request.body
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors)
            return;
        }
        let orderStatistics=[];
        //平均消费
        if(body.status==1){
            orderStatistics = await orderStatistic.getAvgConsumption(body.tenantId,body.startTime,body.endTime,body.type)
        }
        //vip平均消费
        if(body.status==2){
            orderStatistics = await orderStatistic.getVipAvgConsumption(body.tenantId,body.startTime,body.endTime,body.type)
        }
        //订单查询
        if(body.status==4){
            orderStatistics = await orderStatistic.getOrder(body.tenantId,body.startTime,body.endTime,body.type)
        }
        //统计订单
        if(body.status==3){
            orderStatistics = await orderStatistic.getOrderNum(body.tenantId,body.startTime,body.endTime,body.type)
        }
        //分成情况
        // if(body.status==4){
        //     orderStatistics = await orderStatistic.getReat(body.tenantId,body.startTime,body.endTime,body.type)
        // }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orderStatistics)
    },

    async saveOrderStatistic(ctx,next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('trade_no').notEmpty();
        ctx.checkBody('totalPrice').notEmpty();
        ctx.checkBody('merchantAmount').notEmpty();
        ctx.checkBody('consigneeAmount').notEmpty();
        ctx.checkBody('deliveryFee').notEmpty();
        ctx.checkBody('refund_amount').notEmpty();
        ctx.checkBody('platfromCouponFee').notEmpty();
        ctx.checkBody('merchantCouponFee').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let jsonOrder = {}
        jsonOrder ={
            tenantId:body.tenantId,
            trade_no:body.trade_no,
            totalPrice:body.totalPrice,
            merchantAmount:body.merchantAmount,
            consigneeAmount:body.consigneeAmount,
            deliveryFee:body.deliveryFee,
            refund_amount:body.refund_amount,
            platfromCouponFee:body.platfromCouponFee,
            merchantCouponFee:body.merchantCouponFee,
        }
        await orderStatistic.setOrders(jsonOrder)
    },

}
