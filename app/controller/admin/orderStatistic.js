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
        if(body.status==3){
            orderStatistics = await orderStatistic.getOrder(body.tenantId,body.startTime,body.endTime,body.type)
        }
        //分成情况
        if(body.status==4){
            orderStatistics = await orderStatistic.getReat(body.tenantId,body.startTime,body.endTime,body.type)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orderStatistics)
    },

    // async getOrder(ctx, next){
    //     ctx.checkBody('tenantId').notEmpty()
    //     let body = ctx.request.body
    //     if (ctx.errors) {
    //         ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
    //         return;
    //     }
    //     let orders = await Order.findAll({
    //         where:{
    //             tenantId:body.tenantId
    //         }
    //     })
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orders)
    // }

}
