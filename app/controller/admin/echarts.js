const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const PaymentReqs = db.models.PaymentReqs;
const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
const Tool = require('../../Tool/tool')
let orderStatistic = require('../statistics/orderStatistic')

module.exports = {
    async getStyle(ctx, next){
        let orderstatistic = await orderStatistic.getStyle()
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orderstatistic)
    },

    async getOrderstatisticByStyle(ctx, next){
        ctx.checkQuery("style").notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let orderstatistic = await orderStatistic.getOrderstatisticByStyle(ctx.query.style)
        let orderstatisticArray = []
        let ArrayPhone = []
        for (let i = 0; i < orderstatistic.length; i++){
            // if(!ArrayPhone.contains(orderstatistic[i].phone)){
            // ArrayPhone.push(orderstatistic[i].phone)
            let orderstatisticJson = {
                id : orderstatistic[i].id,
                tenantId : orderstatistic[i].tenantId,
                trade_no : orderstatistic[i].trade_no,
                totalPrice : orderstatistic[i].totalPrice,
                merchantAmount : orderstatistic[i].merchantAmount,
                consigneeAmount : orderstatistic[i].consigneeAmount,
                platformAmount : orderstatistic[i].platformAmount,
                refund_amount : orderstatistic[i].refund_amount,
                platformCouponFee : orderstatistic[i].platformCouponFee,
                merchantCouponFee : orderstatistic[i].merchantCouponFee,
                phone : orderstatistic[i].phone,
                style : JSON.parse(orderstatistic[i].style),
                createTime : orderstatistic[i].createTime,
            }
            orderstatisticArray.push(orderstatisticJson)

            // }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orderstatisticArray)
    },

    async savefoodEchats(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR);
        }
        let result = await getFoodEchats.getfEchats(body.tenantId, body.startTime, body.type);
        if (result.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, "找不到数据");
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result);
    },

    async yesterDayFoods(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        let body = ctx.request.body
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR);
        }
        let date = new Date()
        date.setDate(date.getDate() - 1)
        let startTime = date.format("yyyy-MM-dd 00:00:00")
        console.log(startTime);
        let result = await getFoodEchats.getfEchats(body.tenantId, startTime, 1);
        if (result.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, "找不到数据");
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result);
    },

    async getOrderStatisticByTime (ctx, next) {
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('startTime').notEmpty()
        ctx.checkBody('endTime').notEmpty()
        ctx.checkBody('type').notEmpty()
        ctx.checkBody('status').notEmpty()
        let body = ctx.request.body
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let orderStatistics = [];
        //平均消费
        if (body.status == 1) {
            orderStatistics = await orderStatistic.getAvgConsumption(body.tenantId, body.startTime, body.endTime, body.type)
        }
        //vip平均消费
        if (body.status == 2) {
            orderStatistics = await orderStatistic.getVipAvgConsumption(body.tenantId, body.startTime, body.endTime, body.type)
        }
        //订单查询
        if (body.status == 4) {
            orderStatistics = await orderStatistic.getOrder(body.tenantId, body.startTime, body.endTime, body.type)
        }
        //统计订单
        if (body.status == 3) {
            orderStatistics = await orderStatistic.getOrderNum(body.tenantId, body.startTime, body.endTime, body.type)
        }
        //分成情况
        if (body.status == 5) {
            orderStatistics = await orderStatistic.getReat(body.tenantId, body.startTime, body.endTime, body.type)
        }
        //新人购买率
        if (body.status == 6) {
            orderStatistics = await orderStatistic.newPurchaseRate(body.tenantId, body.startTime, body.endTime, body.type)
        }

        //重复购买率
        if (body.status == 7) {
            orderStatistics = await orderStatistic.Retention(body.tenantId, body.startTime, body.endTime, body.type)
        }
        
        if (body.status == 8) {
            orderStatistics = await orderStatistic.xinren(body.tenantId)
        }


        //分成情况
        // if(body.status==4){
        //     orderStatistics = await orderStatistic.getReat(body.tenantId,body.startTime,body.endTime,body.type)
        // }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, orderStatistics)
    },

    async getAllOrderStatistic(ctx, next){
        // console.log(ctx.query)
        ctx.checkQuery('tenantId').notEmpty();
        // ctx,checkQuery('startTime').notEmpty();
        // ctx,checkQuery('endTime').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        // let result =  getMonthEchats.getMonth(ctx.query.startTime,ctx.query.endTime);
        // for(let i = 0;i<result.length;i++){
        let statisticsOrders = await StatisticsOrders.findAll({
            where: {
                tenantId: ctx.query.tenantId
            }
        })
        // }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, statisticsOrders)

    },

}