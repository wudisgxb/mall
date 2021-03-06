const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
let NewOrders = db.models.NewOrders;
let OrderGoods = db.models.OrderGoods;
let PaymentReqs = db.models.PaymentReqs
let amountManage = require('../amount/amountManager')

module.exports = {
    async getGoodsWriteOff(ctx, next) {
        ctx.checkQuery('tenantId').notBlank();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        if(ctx.query.startDate==null){
            ctx.query.startDate = new Date("2000-01-01")
        }
        if(ctx.query.endDate==null){
            ctx.query.endDate = new Date()
        }
        let orders = await NewOrders.findAll({
            where:{
                tenantId : ctx.query.tenantId,
                createdAt :{
                    $gte : ctx.query.startDate,
                    $lt : ctx.query.endDate
                },
                status : 4
            }
        })

        let totalPrices = 0//商品订单总金额
        let discountss = 0//优惠金额
        let reimbursePrices =0//退款金额
        let writeOffGoodsNums = 0//核销商品的数量
        let reimburseGoodsNums = 0//退款商品的数量
        let goodsPracticalPrices = 0//商品实收金额
        let serviceCharges = 0//暂时没有
        let orderArray = []
        // for(let o of order){
        //     if(!orderArray.contains(o.trade_no)){
        //         orderArray.push(o.trade_no)
        //     }
        // }
        let orderJson = {}
        for(let i = 0; i < orders.length; i++){
            let totalPrice =0
            let num = 0;
            let discounts =0
            let tradeNo = orders[i].trade_no
            let orderGoods = await OrderGoods.findAll({
                where:{
                    tenantId : ctx.query.tenantId,
                    trade_no : tradeNo
                }
            })

            let paymentreqs = await PaymentReqs.findOne({
                where:{
                    tenantId : ctx.query.tenantId,
                    trade_no : tradeNo
                }
            })

            let reimbursePrice = paymentreqs.refund_amount
            let reimburseGoodsNum = 0
            if(reimbursePrice>0){
                for(let j = 0; j < orderGoods.length; j++){
                    // totalPrice = orderGoods[j].num*orderGoods[j].price+total
                    reimburseGoodsNum = orderGoods[j].num+reimburseGoodsNum
                }
            }

            for(let j = 0; j < orderGoods.length; j++){
                totalPrice = orderGoods[j].num*orderGoods[j].price+totalPrice
                num = orderGoods[j].num+num
            }
            if(totalPrice!=paymentreqs.total_amount){
                discounts = totalPrice-paymentreqs.total_amount
            }
            totalPrices = totalPrice+totalPrices
            discountss = discounts + discountss
            reimbursePrices = Number(reimbursePrice) + reimbursePrices
            writeOffGoodsNums = num + writeOffGoodsNums
            reimburseGoodsNums = reimburseGoodsNum +reimburseGoodsNums
            // let payment = paymentreqs.paymentMethod
            // let amount = await amountManage.getTransAccountAmount(ctx.query.tenantId,orders[i].consigneeId,tradeNo,payment,reimbursePrices)

        }
        let goodsWriteoffRevenue = totalPrices-discountss-reimbursePrices
        orderJson.goodsWriteoffRevenue = goodsWriteoffRevenue
        orderJson.goodsOrderAmount = totalPrices
        orderJson.goodsWriteoffMerchantDiscount = discountss
        orderJson.writeoffRefundAmount = reimbursePrices
        orderJson.goodsWriteoffCount = writeOffGoodsNums
        orderJson.goodsWriteoffRefundCount = reimburseGoodsNums
        orderJson.goodsWriteoffRevenueNet=goodsWriteoffRevenue-0
        let OrderArray = []
        OrderArray.push(orderJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,OrderArray)
    },
    async getPracticalWriteOff(ctx,next){
        ctx.checkQuery('tenantId').notBlank();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        if(ctx.query.startDate==null){
            ctx.query.startDate = new Date("2000-01-01")
        }
        if(ctx.query.endDate==null){
            ctx.query.endDate = new Date()
        }

        let orders = await NewOrders.findAll({
            where:{
                tenantId : ctx.query.tenantId,
                createdAt :{
                    $gte : ctx.query.startDate,
                    $lt : ctx.query.endDate
                },
                status : 2
            }
        })

        let totalPrices = 0//商品订单总金额
        let discountss = 0//优惠金额
        let reimbursePrices =0//退款金额
        let writeOffGoodsNums = 0//核销商品的数量
        let reimburseGoodsNums = 0//退款商品的数量

        let orderJson = {}
        for(let i = 0; i < orders.length; i++){
            let totalPrice =0
            let num = 0;
            let discounts =0
            let tradeNo = orders[i].trade_no
            let orderGoods = await OrderGoods.findAll({
                where:{
                    tenantId : ctx.query.tenantId,
                    trade_no : tradeNo
                }
            })

            let paymentreqs = await PaymentReqs.findOne({
                where:{
                    tenantId : ctx.query.tenantId,
                    trade_no : tradeNo
                }
            })

            let reimbursePrice = paymentreqs.refund_amount
            let reimburseGoodsNum = 0
            for(let j = 0; j < orderGoods.length; j++){
                totalPrice = orderGoods[j].num*orderGoods[j].price+totalPrice
                num = orderGoods[j].num+num
            }
            if(reimbursePrice>0){
                for(let j = 0; j < orderGoods.length; j++){
                    // totalPrice = orderGoods[j].num*orderGoods[j].price+total
                    reimburseGoodsNum = orderGoods[j].num+reimburseGoodsNum
                }
            }
            console.log("总金额"+totalPrice)
            console.log("付款金额"+paymentreqs.total_amount)
            discounts = totalPrice-paymentreqs.total_amount
            if(paymentreqs.refund_amount!=0){
                reimburseGoodsNums++
            }
            totalPrices = totalPrice+totalPrices
            discountss = discounts + discountss
            reimbursePrices = Number(reimbursePrice) + reimbursePrices
        }
        let revenueReceived = totalPrices-discountss-reimbursePrices
        orderJson.revenueReceived = revenueReceived
        orderJson.receivedOrderAmount = totalPrices
        orderJson.receivedOrderMerchantDiscount = discountss
        orderJson.receivedRefundAmount = reimbursePrices
        orderJson.receivedOrderCount = orders.length-reimburseGoodsNums
        orderJson.receivedOrderRefundCount = reimburseGoodsNums
        orderJson.revenueReceivedNet = revenueReceived
        let OrderArray = []
        OrderArray.push(orderJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,OrderArray)
    },
    async getPractical(ctx,next){
        ctx.checkQuery('aaa').notEmpty()
        let aaa = ctx.request.header(this.getPracticalWriteOff)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,aaa)
    }
}