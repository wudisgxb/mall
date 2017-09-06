const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/statisticsMySql/index');
let db1 = require('../../db/mysql/index');
let Merchants = db1.models.Merchants

// let dbv3 = require('../../db/mysql/index')
let Orders = db1.models.Orders
// let ProfitSharings = db1.models.ProfitSharings
let StatisticsOrders = db.models.Orders;
let Coupons = db1.models.Coupons;
let Vips = db1.models.Vips;
let getMonthEchats = require('../echats/MonthEchats')
let amountManager = require('../amount/amountManager')
let orderStatistic = require('../statistics/orderStatistic')

var start = new Date('2017-07-01 10:11:34').getTime()

var minMills = 3 * 60 * 60 * 1000
var maxMills = 3.5 * 60 * 60 * 1000
module.exports = {
    async saveVipAndCoupons(ctx, next){
        ctx.checkBody('tenantId').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

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

    //根據金錢段查詢記錄，可分頁
    async getOrderstatisticByPrice(ctx,next){
        ctx.checkQuery("tenantId").notEmpty()
        ctx.checkQuery("minPrice").notEmpty()
        ctx.checkQuery("maxPrice").notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let minPrice = ctx.query.minPrice
        let tenantId = ctx.query.tenantId
        let maxPrice = ctx.query.maxPrice
        //頁數
        let pageSize = ctx.query.pageSize
        //每頁顯示個數
        let pageCount = ctx.query.pageCount
        let whereJson={
            tenantId : tenantId,
            merchantAmount : {
                $gte : minPrice,
                $lt : maxPrice
            }
        }
        //起始位置
        let offset = (pageSize-1)*pageCount

        let limitJson = {}
        if(pageCount != null && pageCount != ""){
            limitJson={
                offset : offset,
                limit : pageCount
            }
        }
        console.log(limitJson.offset==null)
        let orders = await orderStatistic.getOrderstatisticByPrice(whereJson,limitJson);
        if(orders.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"沒找到當前記錄")
            return;
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orders)
    },

    //周,月购买一次,两次的人数 (购买频率)-- 手机号码
    async getOrderstatisticByPeople(ctx,next){
        ctx.checkQuery("tenantId").notEmpty();
        ctx.checkQuery("purchaseFrequency").notEmpty();
        ctx.checkQuery("type").notEmpty();
        ctx.checkQuery("startTime").notEmpty();
        ctx.checkQuery("endTime").notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let order = await orderStatistic.getOrderstatisticByPeople(ctx.query.tenantId,ctx.query.purchaseFrequency,ctx.query.type,ctx.query.startTime,ctx.query.endTime)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,order)
    },

    //优惠券带动交易额
    async getActivity(ctx,next){
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('startTime').notEmpty()
        ctx.checkBody('endTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let order = await orderStatistic.getActivity(body.tenantId,body.startTime,body.endTime,body.type)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,order)
    },

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
        if (body.status == 5) {
            orderStatistics = await orderStatistic.getReat(body.tenantId, body.startTime, body.endTime, body.type)
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

    async putOrderStatistic(ctx, next){
        let merchants = await Merchants.findAll({})

        let statisticsOrdersArray = []
        for(let i = 0; i < merchants.length; i++){
            if(merchants[i].style!=null){
                statisticsOrdersArray.push(StatisticsOrders.update({
                    style : merchants[i].style
                },{
                    where:{
                        tenantId : merchants[i].tenantId
                    }
                }))
            }
        }
        await statisticsOrdersArray;
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,"修改成功")
    },

    async status2Mdf(ctx, next){
        let body = ctx.request.body;

        await db1.models.Orders.update({
            deletedAt: null
        }, {
            where: {
                status: 2,
                deletedAt: {
                    $ne: null
                }
            },
        });

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async updateOrder(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        // ctx.checkBody('phone').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let orders = await Orders.findAll({
            where: {
                tenantId: body.tenantId,
            }
        })
        // let ArrayTrand_no = [];
        // for (let i = 0; i < orders.length; i++) {
        //     if (!ArrayTrand_no.contains(orders[i].trade_no)) {
        //         ArrayTrand_no.push(orders[i].trade_no)
        //     }
        // }
        let days = generateDays(orders.length);
        days = days.map(e => {
            const hour = e.getHours()
            if (hour <= 10) {
                e.setHours(hour + 10)
            }
            // console.log(e.toString())
            return e
        })
        for (let j = 0; j < orders.length; j++) {
            await Orders.update({
                createdAt: days[j]
            }, {
                where: {
                    tenantId: body.tenantId
                }
            })
            // let order = await Orders.findOne({
            //     where:{
            //         trade_no:ArrayTrand_no[j],
            //         status:2
            //     }
            // })
            // let retJson = await amountManager.getTransAccountAmount( body.tenantId, order.consigneeId, ArrayTrand_no[j], order.paymentMethod, 0);


            // let profitSharings = await ProfitSharings.findOne({
            //     where:{
            //         tenantId : order.tenantId,
            //         consigneeId : order.consigneeId,
            //     }
            // })
            // let orderstastistic = await StatisticsOrders.findOne({
            //     where: {
            //         trade_no: ArrayTrand_no[j]
            //     }
            // })


        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }

}

function name() {
    let randomName = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
    let nameLength = Math.ceil(Math.random() * 10)
    let names;
    for (let i = 0; i < nameLength.length; i++) {
        let name = randomName[Math.ceil(Math.random() * (randomName.length - 1))];
        names = names + name
    }
    return names
}
function getphone() {
    let last = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
    let second = ["3", "4", "5", "8"]
    let third = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
    let secondisEight = ["2", "6", "7", "8", "9"]
    let secondisfire = ["5", "7"]
    let secondPhone = second[Math.ceil(Math.random() * 3)];
    let thirdPhone;
    if (secondPhone == "3" || secondPhone == "5") {
        thirdPhone = third[Math.ceil(Math.random() * 9)];
    }
    if (secondPhone == "8") {
        thirdPhone = secondisEight[Math.ceil(Math.random() * 4)];
    }
    if (secondPhone == "4") {
        thirdPhone = secondisfire[Math.ceil(Math.random() * 1)];
    }
    let lastPhone = 0;
    for (let i = 0; i < 7; i++) {
        lastPhone += last[Math.ceil(Math.random() * 9)];
    }

    let phone = 1 + "" + secondPhone + thirdPhone + "" + lastPhone
    return phone;
}

function generateDays(length) {
    return generateMills(length).map(e => new Date(e + start))
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

