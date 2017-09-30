const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let Alliances = db.models.Alliances
let Headquarters = db.models.Headquarters
let AllianceIntegrals = db.models.AllianceIntegrals
let HeadquartersIntegrals = db.models.HeadquartersIntegrals
let VipIntegrals = db.models.VipIntegrals
let Vips = db.models.Vips
let Merchants = db.models.Merchants
let AllianceMerchants = db.models.AllianceMerchants
let AllianceHeadquarters = db.models.AllianceHeadquarters
let MerchantIntegrals = db.models.MerchantIntegrals
let amountManager = require('../amount/amountManager')

//链接数据库


module.exports = {
    //新增记录只能增加会员的积分
    async saveVipIntegrals(ctx,next){
        // ctx.checkBody('phone').notEmpty();
        // ctx.checkBody('buyOrSaleMerchant').notEmpty();
        // ctx.checkBody('integral').notEmpty();
        // if(ctx.errors){
        //     ctx.body =new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
        //     return
        // }
        // let body = ctx.request.body
        //
        // //查询商圈租户的配置信息
        // let allianceMerchants = await AllianceMerchants.findOne({
        //     where:{
        //         tenantId :body.buyOrSaleMerchant
        //     }
        // })
        // //判断商圈与租户的配置是否存在
        // if(allianceMerchants==null){
        //     ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此租户和商圈的配置")
        //     return
        // }
        //
        // //查询这个Vip用户
        // let vip = await Vips.findOne({
        //     where:{
        //         phone : body.phone,
        //         alliacesId : allianceMerchants.alliacesId
        //     }
        // })
        // //判断用户是否存在
        // if(vip==null){
        //     ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有找到这个Vip")
        //     return
        // }
        // //查询这个租户
        // let merchant = await Merchants.findOne({
        //     where:{
        //         tenantId : body.buyOrSaleMerchant
        //     }
        // })
        // let merchantRebate = 20;
        // //判断租户的积分是否大于需要开销的积分
        // if(Number(merchant.aggregateScore)<(body.integral+merchantRebate)){
        //     ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,"积分不够")
        //     return
        // }
        // //用户总积分为用户的积分-body.integral
        // let merchantIntegral = Number(merchant.aggregateScore)-(body.integral+20)
        // //修改用户的总积分
        // await Merchants.update({
        //     aggregateScore:merchantIntegral
        // },{
        //     where:{
        //         tenantId : body.buyOrSaleMerchant,
        //     }
        // })
        // //将用户对会员的积分记录下来
        // let merchantIntegralsId = "vipM"+Tool.allocTenantId().substring(4)
        // await MerchantIntegrals.create({
        //     merchantIntegralsId : merchantIntegralsId,
        //     tenantId : body.buyOrSaleMerchant,
        //     buyOrSale : 0,
        //     buyOrSaleMerchant : vip.id,
        //     price :0,
        //     integral : body.integral,
        //     // allianceId :allianceMerchants.alliancesId
        // })
        //
        // //将用户对商圈的积分记录下来
        // let alliancesIntegralsId = "allM"+Tool.allocTenantId().substring(4)
        // await MerchantIntegrals.create({
        //     merchantIntegralsId : merchantIntegralsId,
        //     tenantId : body.buyOrSaleMerchant,
        //     buyOrSale : 0,
        //     buyOrSaleMerchant : allianceMerchants.alliancesId,
        //     price :0,
        //     integral : body.integral,
        //     // allianceId :allianceMerchants.alliancesId
        // })
        //
        // //根据商圈查询平台
        // let allianceHeadquarters = await AllianceHeadquarters.findOne({
        //     where:{
        //         allianceId :allianceMerchants.alliancesId
        //     }
        // })
        //
        // //将租户对平台的积分记录下来
        // let headquartersIntegralsId = "heaM"+Tool.allocTenantId().substring(4)
        // await MerchantIntegrals.create({
        //     merchantIntegralsId : headquartersIntegralsId,
        //     tenantId : body.buyOrSaleMerchant,
        //     buyOrSale : 0,
        //     buyOrSaleMerchant : allianceHeadquarters.headquartersId,
        //     price :0,
        //     integral : body.integral,
        //     // allianceId :allianceMerchants.alliancesId
        // })
        //
        //
        // //记录下会员的积分消费
        // let vipIntegralsId = "merV"+Tool.allocTenantId().substring(4)
        // await VipIntegrals.create({
        //     vipIntegralsId : vipIntegralsId,
        //     vipId : vip.id,
        //     buyOrSale : 1,
        //     buyOrSaleMerchant : body.buyOrSaleMerchant,
        //     price :0,
        //     integral : body.integral,
        //     allianceId :allianceMerchants.alliancesId
        // })
        // //修改会员的积分
        // let integral = Number(vip.aggregateScore)+body.integral
        // await Vips.update({
        //     aggregateScore : integral
        // },{
        //     where:{
        //         phone : body.phone,
        //         alliacesId : allianceMerchants.alliacesId
        //     }
        // })
        //
        // let allianceIntegralsId = "merA"+Tool.allocTenantId().substring(4)
        // await AllianceIntegrals.create({
        //     allianceIntegralsId :allianceIntegralsId,
        //     alliancesId : allianceMerchants.alliancesId,
        //     buyOrSale : 0,
        //     buyOrSaleMerchant : body.buyOrSaleMerchant,
        //     price : 0,
        //     integral : 4
        // })
        // let alliance = await Alliances.findOne({
        //     where:{
        //         alliancesId : allianceMerchants.alliancesId,
        //     }
        // })
        // let aggregateScoreAlliances = Number(alliance.aggregateScore)+4
        // await Alliances.update({
        //     aggregateScore : aggregateScoreAlliances
        // },{
        //     where:{
        //         alliancesId : allianceMerchants.alliancesId,
        //     }
        // })
        //
        //
        // let headquartersIntegralsId = "merA"+Tool.allocTenantId().substring(4)
        // await HeadquartersIntegrals.create({
        //     headquartersIntegralsId :headquartersIntegralsId,
        //     headquartersId : allianceHeadquarters.headquartersId,
        //     buyOrSale : 0,
        //     buyOrSaleMerchant : body.buyOrSaleMerchant,
        //     price : 0,
        //     integral : 2
        // })
        // let headquarters = await Headquarters.findOne({
        //     where:{
        //         headquartersId : allianceHeadquarters.headquartersId,
        //     }
        // })
        // let aggregateScoreheadquarters = Number(headquarters.aggregateScore)+2
        // await Headquarters.update({
        //     aggregateScore : aggregateScoreheadquarters
        // },{
        //     where:{
        //         headquartersId : allianceHeadquarters.headquartersId,
        //     }
        // })
        //
        // ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
        //

    },
    async getVipIntegrals(ctx,next){
        ctx.checkQuery('phone').notEmpty();
        ctx.checkQuery('alliancesId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let vip = await Vips.findOne({
            where:{
                phone : ctx.query.phone,
                alliancesId : ctx.query.alliancesId
            }
        })
        if(vip==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此会员")
            return
        }
        let vipIntegrals = await VipIntegrals.findAll({
            where:{
                vipId:vip.id
            }
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,vipIntegrals)
    }

}
