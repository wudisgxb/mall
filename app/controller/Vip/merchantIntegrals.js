const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')

let VipIntegrals = db.models.VipIntegrals
let Vips = db.models.Vips
let Merchants = db.models.Merchants
let AllianceMerchants = db.models.AllianceMerchants
let MerchantIntegrals = db.models.MerchantIntegrals
let amountManager = require('../amount/amountManager')

//链接数据库


module.exports = {
    async getMerchantIntegrals(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        
        let merchant = await Merchants.findOne({
            where:{
                tenantId:ctx.query.tenantId
            }
        })
        if(merchant==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个租户")
            return
        }
        let merchantIntegrals = await MerchantIntegrals.findAll({
            where:{
                tenantId:ctx.query.tenantId
            }
        })
        let merchantArray = []
        for(let i =0; i <merchantIntegrals.length; i++){
            let buyOrSaleObject
            let buyOrSaleMerchant = merchantIntegrals[i].buyOrSaleMerchant.substring(0,4)
            if(merchantIntegrals[i].buyOrSaleMerchant.length!=32){
                buyOrSaleObject =="会员"
            }
            if(buyOrSaleMerchant=="1111"){
                buyOrSaleObject =="平台"
            }
            if(buyOrSaleMerchant=="2222"){
                buyOrSaleObject =="商圈"
            }
            if(buyOrSaleMerchant=="3333"){
                buyOrSaleObject =="租户"
            }
            let merchantJson = {
                merchantIntegralsId :{
                    name : "租户的唯一Id",
                    value : merchantIntegrals[i].merchantIntegralsId
                },
                tenantIdName :{
                    name : "租户",
                    value : merchant.name
                },
                tenantId :{
                    name : "租户Id",
                    value : ctx.query.tenantId
                },
                buyOrSale :{
                    name : "积分交易商",
                    value : merchantIntegrals[i].buyOrSale==0?"买入商":"卖出商"
                },
                buyOrSaleMerchant :{
                    name : "交易对象"+buyOrSaleObject,
                    value : merchantIntegrals[i].buyOrSaleMerchant
                },
                price :{
                    name : "金额",
                    value : merchantIntegrals[i].price
                },
                integral :{
                    name : "积分",
                    value :merchantIntegrals[i].integral
                }



            }
            merchantArray.push(merchantJson)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,merchantArray)
    }

}

