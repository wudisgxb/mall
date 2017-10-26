const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let distanceAndPrice = require('../distanceandprice/distanceandprice')
module.exports = {

    async getDistanceFee(ctx, next){
        //根据商家查询配送费信息
        ctx.checkQuery('tenantId').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let dis = await distanceAndPrice.getdistanceandprice({tenantId : ctx.query.tenantId});


        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, dis)
    },

    // async getDistanceFeeDistance(ctx,next){
    //     let getDistanceAll
    //     getDistanceAll = getAll
    //     ctx.checkQuery('distance').notEmpty();
    //     let distance = ctx.query.distance
    //     if(ctx.errors){
    //         ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors)
    //         return;
    //     }
    //     let result=[]
    //     for(let dis of getAll){
    //         let min = dis.minDistance;
    //         let max = dis.maxDistance;
    //         if(distance>=min&&distance<max){
    //             result.push(dis)
    //         }
    //     }
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS,result)
    // },

    async saveDistanceFee(ctx, next){
        ctx.checkBody('tenantId').notEmpty()
        // ctx.checkBody('deliveryFeeId').notEmpty()
        ctx.checkBody('minDistance').notEmpty()
        ctx.checkBody('maxDistance').notEmpty()
        ctx.checkBody('deliveryFee').notEmpty()//配送费
        ctx.checkBody('startPrice').notEmpty()//起送价
        ctx.checkBody('deliveryTime').notEmpty()//花费时间
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }

        let deliveryFeeId = new Date().getTime() + "" + Math.ceil(Math.random() * 8999 + 1000)
        let  merchant = await distanceAndPrice.getMerchant({tenantId:body.tenantId})

        if(merchant==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到当前记录")
            return
        }
        console.log(merchant)
        let saveJson = {
            tenantId: body.tenantId,
            deliveryFeeId: deliveryFeeId,
            minDistance: body.minDistance,
            maxDistance: body.maxDistance,
            deliveryFee: body.deliveryFee,
            startPrice: body.startPrice,
            deliveryTime: body.deliveryTime
        }
        await distanceAndPrice.saveDistanceAndPrice(saveJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, deliveryFeeId)
    },
    async updateDistanceFee(ctx, next){
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('deliveryFeeId').notEmpty()
        ctx.checkBody('minDistance').notEmpty()
        ctx.checkBody('maxDistance').notEmpty()
        ctx.checkBody('deliveryFee').notEmpty()
        ctx.checkBody('startPrice').notEmpty()
        ctx.checkBody('deliveryTime').notEmpty()
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        //需要修改的json
        let updateJson = {
            minDistance: body.minDistance,
            maxDistance: body.maxDistance,
            deliveryFee: body.deliveryFee,
            startPrice: body.startPrice,
            deliveryTime: body.deliveryTime,
        }
        //需要修改的条件
        let whereJson = {
            tenantId: body.tenantId,
            deliveryFeeId: body.deliveryFeeId
        }
        await distanceAndPrice.updateDistanceAndPrice(updateJson, whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async deleteDistanceFee(ctx, next){
        ctx.checkQuery('tenantId').notEmpty()
        ctx.checkQuery('deliveryFeeId').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let getjson = {
            tenantId: ctx.query.tenantId,
            deliveryFeeId: ctx.query.deliveryFeeId
        }
        let getOne = await distanceAndPrice.getdistanceandpriceOne(getjson);
        // await distanceAndPrice.deleteDistanceAndPrice(getOne)
        if (getOne == null) {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, "没有此配送信息")
            return;
        }
        await getOne.destroy()
        // let aaa = getjson
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }
}