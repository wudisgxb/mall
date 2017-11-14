// const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
// const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let OnStocks = db.models.OnStocks;
let Foods = db.models.Foods
let WareHouseManages = db.models.WareHouseManages

let getFoodNum = require('../../controller/statistics/statistics');

module.exports = {
    async saveOnStock(ctx,next){
        ctx.checkBody('tenantId').notBlank();
        ctx.checkBody('name').notBlank();
        ctx.checkBody('num').notBlank();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.query.body
        let wareHouseManages = await WareHouseManages.findOne({
            where:{
                tenantId : body.tenantId,
                name : body.name
            }
        })
        if(wareHouseManages.num<body.num){
            ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,"你的库存里"+name+"商品不足")
            return
        }
        await OnStocks.create({
            name : body.name,
            goodsNumber : wareHouseManages.goodsNumber,
            property : wareHouseManages.property,
            unit : wareHouseManages.unit,
            unitPrice : wareHouseManages.constPrice,
            personInCharge  : body.personInCharge!=null?body.personInCharge:"",
            time : new Date(),
            info : body.info!=null?body.info:"",
            totalPrice : Number(wareHouseManages.constPrice)*Number(body.num),
            goodsStatus : 1,
            tenantId : body.tenantId

        })
        await WareHouseManages.update({
            num : wareHouseManages.num-body.num,

        },{
            where:{
                tenantId : body.tenantId,
                name : body.name
            }
        })
        let foods = await Foods.findOne({
            where:{
                tenantId : body.tenantId,
                name : body.name
            }
        })
        if(foods==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此商品");
            return
        }
        await Foods.update({
            foodNum : Number(foods.foodNum)+Number(body.num)
        },{
            where:{
                tenantId : body.tenantId,
                name : body.name
            }
        })


        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getOnStock(ctx,next){
        let keys = ['tenantId','name','goodsNumber','property','personInCharge']
        let condition = keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})
        let onStocks = await OnStocks.findAll({
            where:condition
        })
        if(onStocks.length>0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没找到当前商品的出库记录")
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

}


