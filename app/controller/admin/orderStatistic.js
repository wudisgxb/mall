const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/statisticsMySql/index');
let Order = db.models.Orders
let dbv3 = require('../../db/Mysql/index')
let StatisticsOrders = db.models.Orders;
let getMonthEchats = require('../echats/MonthEchats')

let orderStatistic = require('../statistics/orderStatistic')

var start = new Date('2017-07-01 10:11:34').getTime()

var minMills = 2 * 60 * 60 * 1000
var maxMills = 2.5 * 60 * 60 * 1000
module.exports = {
    async getOrderStatistic (ctx, next) {
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
        // if(body.status==4){
        //     orderStatistics = await orderStatistic.getReat(body.tenantId,body.startTime,body.endTime,body.type)
        // }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, orderStatistics)
    },

    async saveOrderStatistic(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('trade_no').notEmpty();
        ctx.checkBody('totalPrice').notEmpty();
        ctx.checkBody('merchantAmount').notEmpty();
        ctx.checkBody('consigneeAmount').notEmpty();
        ctx.checkBody('deliveryFee').notEmpty();
        ctx.checkBody('refund_amount').notEmpty();
        ctx.checkBody('platfromCouponFee').notEmpty();
        ctx.checkBody('merchantCouponFee').notEmpty();
        ctx.checkBody('phone').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let jsonOrder = {}

        jsonOrder.tenantId = body.tenantId;
        jsonOrder.trade_no = body.trade_no;
        jsonOrder.totalPrice = body.totalPrice;
        jsonOrder.merchantAmount = body.merchantAmount;
        jsonOrder.consigneeAmount = body.consigneeAmount;
        jsonOrder.deliveryFee = body.deliveryFee;
        jsonOrder.refund_amount = body.refund_amount;
        jsonOrder.platfromCouponFee = body.platfromCouponFee;
        jsonOrder.merchantCouponFee = body.merchantCouponFee;
        jsonOrder.phone = body.phone;
        jsonOrder.consigneeId = body.consigneeId;

        await orderStatistic.setOrders(jsonOrder);

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async getAllOrderStatistic(ctx, next){
        // console.log(ctx.query)
        ctx.checkQuery('tenantId').notEmpty();
        // ctx,checkQuery('startTime').notEmpty();
        // ctx,checkQuery('endTime').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        // let result =  getMonthEchats.getMonth(ctx.query.startTime,ctx.query.endTime);
        // for(let i = 0;i<result.length;i++){
        let statisticsOrders = await StatisticsOrders.findAll({
            where:{
                tenantId : ctx.query.tenantId
            }
        })
        // }
        ctx.body =  new ApiResult(ApiResult.Result.SUCCESS,statisticsOrders)

    },

    async putOrderStatistic(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        // ctx.checkBody('phone').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let statisticsOrders = await StatisticsOrders.findAll({
            where:{
                tenantId : body.tenantId
            },
            raw: true
        })

        if(statisticsOrders.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没找到数据")
            return;
        }




        // for(let j = 0;j<=8;j++){
        //     StringPhone = Math.floor(Math.random()*10)+StringPhone
        // }
        // let phone = subStringPhone+StringPhone
        const days = generateDays(statisticsOrders.length)
        for (let i =0; i<statisticsOrders.length;i++){
            //电话号码后面8位
            let lastphone = ['0','1','2','3','4','5','6','7','8','9']
            let phoneNum = 8
            let test = "";
            for(let j=0;j<phoneNum;j++){
                let pos = Math.floor(Math.random()*phoneNum);
                test += lastphone[pos];
            }
            let totalPrice = 0
            let mer = 0

            let subStringPhone = statisticsOrders[i].phone.substring(0,3);
            let phone = subStringPhone+test;

            if(statisticsOrders[i].totalPrice<5){
                totalPrice=Number((statisticsOrders[i].totalPrice*100).toFixed(2))
                mer = Number((statisticsOrders[i].merchantAmount*100).toFixed(2))
            }
            statisticsOrders[i].trade_no = statisticsOrders[i].trade_no;
            statisticsOrders[i].totalPrice=(totalPrice==0?80:totalPrice);
            statisticsOrders[i].merchantAmount=(mer==0?80:mer);
            statisticsOrders[i].consigneeAmount = statisticsOrders[i].consigneeAmount;
            statisticsOrders[i].platformAmount = statisticsOrders[i].platformAmount;
            statisticsOrders[i].deliveryFee = statisticsOrders[i].deliveryFee;
            statisticsOrders[i].refund_amount = statisticsOrders[i].refund_amount;
            statisticsOrders[i].platfromCouponFee = statisticsOrders[i].platfromCouponFee;
            statisticsOrders[i].merchantCouponFee = statisticsOrders[i].merchantCouponFee;
            statisticsOrders[i].phone = phone;
            statisticsOrders[i].tenantId = body.tenantId
            statisticsOrders[i].consigneeId = statisticsOrders[i].consigneeId
            // statisticsOrders[i].createdTime = days[i]
            await statisticsOrders[i].save();
        }

        ctx.body =  new ApiResult(ApiResult.Result.SUCCESS,statisticsOrders)

    },

}


function generateDays(length) {
    return generateMills(length).map(e => new Date(e+start))
}

function getRandom(min, max) {
    return Math.round(Math.random() * (max - min + 1)) + min
}

function generateMills(length) {
    const result = [0]
    for (let i = 0; i < length - 1; i += 1) {
        result.push(result[i] + getRandom(minMills, maxMills))
    }
    return result
}

