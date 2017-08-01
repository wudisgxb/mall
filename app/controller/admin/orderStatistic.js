const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/statisticsMySql/index');
let db1 = require('../../db/mysql/index');
// let Order = db.models.Orders

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
    async saveVipAndCoupons(ctx,next){
        ctx.checkBody('tenantId').notEmpty();
        let body = ctx.request.body
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }

        // let vipOrder = await StatisticsOrders.getTotalPriceByTenantId(body.tenantId)
        // for(let j = 0; j < vipOrder.length; j++ ){
        //     let vipName = name();
        //     await Vips.create({
        //         phone : vipOrder[j].phone,
        //         vipLevel : 1 ,
        //         vipName : 111,
        //         tenantId:body.tenantId,
        //         isTest :true
        //     })
        // }

        let coupons = await Coupons.findAll({
            where:{
                tenantId : body.tenantId,
            }
        })
       
        for (var i = 0; i < coupons.length; i++) {
            let order = await StatisticsOrders.findOne({
                where:{
                    trade_no : coupons[i].trade_no
                }
            })
            var couponKey = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);
            await Coupons.update({
                couponKey : couponKey,
                // couponRate : 1,
                // couponType : "金额",
                // value : (Number(ordersCoupons[i].merchantCouponFee))+(Number(ordersCoupons[i].platformCouponFee)),
                status : 1,
                // phone : ordersCoupons[i].phone,
                // trade_no : ordersCoupons[i].trade_no,
                // isTest : true,
                createdAt :order.createdAt,
            },{
                where:{
                    trade_no : order.trade_no
                }
            })
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,"")
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
        ctx.checkBody('tenantId').notEmpty();
        // ctx.checkBody('phone').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let statisticsOrders = await StatisticsOrders.findAll({
            where: {
                tenantId: body.tenantId
            }
        })

        if (statisticsOrders.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没找到数据")
            return;
        }


        // for(let j = 0;j<=8;j++){
        //     StringPhone = Math.floor(Math.random()*10)+StringPhone
        // }
        // let phone = subStringPhone+StringPhone
        let days = generateDays(statisticsOrders.length)
        days = days.map(e => {
            const hour = e.getHours()
            if (hour <= 10) {
                e.setHours(hour + 10)
            }
            // console.log(e.toString())
            return e
        })

        for (let i = 0; i < statisticsOrders.length; i++) {
            //电话号码后面8位

            // let lastphone = ['0','1','2','3','4','5','6','7','8','9']
            // let phoneNum = 8
            let test = "";
            // for(let j=0;j<phoneNum;j++){
            //     let pos = Math.floor(Math.random()*phoneNum);
            //     test += lastphone[pos];
            // }
            let totalPrice=0;
            let mer = 0
            let pla = 0

            // let subStringPhone = statisticsOrders[i].phone.substring(0,3);
            // let phone = subStringPhone+test;
            let phone = getphone();//电话号码

            if (statisticsOrders[i].totalPrice < 5) {//价格
                totalPrice = Number((statisticsOrders[i].totalPrice * 100).toFixed(2))
                mer = Number((statisticsOrders[i].merchantAmount * 100).toFixed(2))
                pla = Number((statisticsOrders[i].platformAmount * 100).toFixed(2))
            }else{
                totalPrice=statisticsOrders[i].totalPrice;
                mer = statisticsOrders[i].merchantAmount;
                pla = statisticsOrders[i].platformAmount;
            }
            let random = Math.ceil(Math.random() * 100)
            let couponFee = 0;
            if ((totalPrice > 80 && totalPrice < 150) && (random < 60 && random > 0)) {
                couponFee = 10
            } else if ((totalPrice > 150 && totalPrice < 210) && (random < 60 && random > 0)) {
                couponFee = 20
            } else if ((totalPrice > 210) && (random < 60 && random > 0)) {
                couponFee = 30
            }
            // console.log("-----------------------")
            // console.log(totalPrice)
            // console.log(random);
            // console.log(couponFee);
            // console.log("-----------------------")
            await StatisticsOrders.update({
                trade_no: statisticsOrders[i].trade_no,
                totalPrice: totalPrice,//(totalPrice==0?80:totalPrice);
                merchantAmount: mer-pla,//(mer==0?80:mer);
                platformAmount: pla,
                platformCouponFee: couponFee / 2,
                merchantCouponFee: couponFee / 2,
                phone: phone,
                // tenantId : body.tenantId,
                // consigneeId : statisticsOrders[i].consigneeId,
                createdAt: days[i],
            },{where:{
                trade_no:statisticsOrders[i].trade_no
            }})
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, statisticsOrders)

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
            paranoid: false
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
            where:{
                tenantId : body.tenantId,
            }
        })
        // let ArrayTrand_no = [];
        // for (let i = 0; i < orders.length; i++) {
        //     if (!ArrayTrand_no.contains(orders[i].trade_no)) {
        //         ArrayTrand_no.push(orders[i].trade_no)
        //     }
        // }
        let days =generateDays(orders.length);
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
                createdAt:days[j]
            },{
                where : {
                    tenantId : body.tenantId
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
    let randomName = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
    let nameLength = Math.ceil(Math.random()*10)
    let names;
    for(let i = 0; i<nameLength.length;i++){
        let name = randomName[Math.ceil(Math.random()*(randomName.length-1))];
        names=names+name
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

