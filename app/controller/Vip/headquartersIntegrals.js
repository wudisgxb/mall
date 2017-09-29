const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')

let VipIntegrals = db.models.VipIntegrals
let Vips = db.models.Vips
let Headquarters = db.models.Headquarters
let HeadquartersIntegrals = db.models.HeadquartersIntegrals
let MerchantIntegrals = db.models.MerchantIntegrals
let amountManager = require('../amount/amountManager')

//链接数据库


module.exports = {
    async getHeadquartersIntegrals(ctx,next){
        ctx.checkQuery('headquartersId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }

        let headquarters = await Headquarters.findOne({
            where:{
                headquartersId:ctx.query.headquartersId
            }
        })
        if(headquarters==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个平台")
            return
        }
        let headquartersIntegrals = await HeadquartersIntegrals.findAll({
            where:{
                headquartersId:ctx.query.headquartersId
            }
        })
        let headquartersArray = []
        for(let i =0; i <headquartersIntegrals.length; i++){
            let buyOrSaleObject
            let buyOrSaleMerchant = headquartersIntegrals[i].buyOrSaleMerchant.substring(0,4)
            if(headquartersIntegrals[i].buyOrSaleMerchant.length!=32){
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
                headquartersIntegralsId :{
                    name : "平台的唯一Id",
                    value : headquartersIntegrals[i].headquartersIntegralsId
                },
                headquartersName :{
                    name : "平台",
                    value : headquarters.name
                },
                headquartersId :{
                    name : "平台Id",
                    value : ctx.query.headquartersId
                },
                buyOrSale :{
                    name : "积分交易商",
                    value : headquartersIntegrals[i].buyOrSale==0?"买入商":"卖出商"
                },
                buyOrSaleMerchant :{
                    name : "交易对象"+buyOrSaleObject,
                    value : headquartersIntegrals[i].buyOrSaleMerchant
                },
                price :{
                    name : "金额",
                    value : headquartersIntegrals[i].price
                },
                integral :{
                    name : "积分",
                    value :headquartersIntegrals[i].integral
                }
            }
            headquartersArray.push(merchantJson)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,headquartersArray)
    }

}
