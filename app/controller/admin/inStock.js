// const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
// const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let InStocks = db.models.InStocks;
let GoodsInfos = db.models.GoodsInfos

let getFoodNum = require('../../controller/statistics/statistics');

module.exports = {
    async saveInStock(ctx,next){
        // ctx.checkBody('name').notBlank()
        // // ctx.checkBody('goodsNumber').notBlank()
        // ctx.checkBody('property').notBlank()
        // ctx.checkBody('num').notBlank()
        // ctx.checkBody('unit').notBlank()
        // ctx.checkBody('unitPrice').notBlank()
        // ctx.checkBody('personInCharge').notEmpty()
        // // ctx.checkBody('time').notBlank()
        // // ctx.checkBody('info').notBlank()
        // ctx.checkBody('totalPrice').notBlank()
        // // ctx.checkBody('goodsStatus').notBlank()
        // ctx.checkBody('tenantId').notBlank()
        ctx.checkBody('inStock').notBlank()

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body

        console.log(InStocks)
        let inStock = body.inStock
        if(inStock.length>0){
            let batchMax = await InStocks.max("batch",{
                where:{
                    tenantId :inStock[0].tenantId
                }
            })

            for(let i = 0; i < inStock.length; i++){
                let goodsNumber = await GoodsInfos.findOne({
                    where:{
                        tenantId : inStock[i].tenantId,
                        name : inStock[i].name,
                    }
                })
                await InStocks.create({
                    name :inStock[i].name,
                    property :inStock[i].property,
                    num :inStock[i].num,
                    unit :inStock[i].unit,
                    goodsNumber : goodsNumber,
                    unitPrice :inStock[i].unitPrice,
                    personInCharge :inStock[i].personInCharge,
                    time : new Date(),
                    info : inStock[i].info!=null?inStock[i].info:"",
                    totalPrice :inStock[i].num*inStock[i].unitPrice,
                    goodsStatus :0,
                    batch : batchMax+1,
                    tenantId :inStock[i].tenantId,
                })
            }

        }else{
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

    },
    async getInStock(){},
}


