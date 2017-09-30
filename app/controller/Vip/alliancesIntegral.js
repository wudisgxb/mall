const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const AllianceIntegrals = db.models.AllianceIntegrals;
const Alliances = db.models.Alliances
const Headquarters = db.models.Headquarters
const HeadquartersIntegrals = db.models.HeadquartersIntegrals
const Tool = require('../../Tool/tool');
// const headQuarters = require('../businessAlliance/headquarters')


module.exports = {
    async saveAlliancesIntegral(ctx, next){
        ctx.checkBody('integral').notEmpty()
        ctx.checkBody('alliancesId').notEmpty()
        ctx.checkBody('headquartersId').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return
        }
        let body = ctx.request.body
        //查询平台
        let headquarters = await Headquarters.findOne({
            where:{
                headquartersId : body.headquartersId
            }
        })
        //判断平台是否存在
        if(headquarters==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此平台");
            return
        }
        //判断平台积分是否够
        if(headquarters.aggregateScore<body.integral){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,"平台的积分不够")
            return
        }
        //生成一个平台Id
        let headquartersIntegralsId = "allH"+Tool.allocTenantId().substring(4)
        //新增平台记录信息
        await HeadquartersIntegrals.create({
            headquartersIntegralsId : headquartersIntegralsId,
            headquartersId : body.headquartersId,
            buyOrSale : 1,//0为获得积分1为失去积分
            buyOrSaleMerchant : body.alliancesId,//失去积分给那个商圈
            price : 0,//商圈给了多少钱
            integral : body.integral//给了商圈多少积分
        })
        //获得平台的积分-当前给出的积分=现有积分
        let aggregateScoreHeadquarters = headquarters.aggregateScore-body.integral
        //修改平台积分
        await Headquarters.update({
            aggregateScore : aggregateScoreHeadquarters
        },{
            where:{
                headquartersId : body.headquartersId
            }
        })

        //随机生成一个上商圈积分Id
        let allianceIntegralsId = "heaA" + Tool.allocTenantId().substring(4)
        //查询商圈
        let alliance = await Alliances.findOne({
            where: {
                alliancesId: body.alliancesId
            }
        })
        //判断商圈是否存在
        if(alliance==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此商圈")
            return
        }
        //添加商圈信息
        await AllianceIntegrals.create({
            allianceIntegralsId: allianceIntegralsId,
            alliancesId: body.alliancesId,
            buyOrSale: 0,
            buyOrSaleMerchant: body.headquartersId,
            price: 0,
            integral: body.integral
        })
        // await AllianceIntegrals
        //修改商圈积分
        let aggregateScoreAlliance = alliance.aggregateScore+integral
        await Alliances.update({
            aggregateScore : aggregateScoreAlliance
        },{
            where:{
                alliancesId: body.alliancesId
            }
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,alliance.name+"商圈的积分为"+aggregateScoreAlliance)

    },
    async getAlliancesIntegral(ctx, next){
        ctx.checkQuery('alliancesId').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return
        }
        let alliances = await Alliances.findOne({
            where: {
                alliancesId: ctx.query.alliancesId
            }
        })
        if (alliances == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此商圈信息")
            return
        }
        let allianceIntegrals = await AllianceIntegrals.findAll({
            where: {
                alliancesId: ctx.query.alliancesId
            }
        })
        let alliancesArray = []
        for (let i = 0; i < allianceIntegrals.length; i++) {
            let buyOrSaleObject
            let buyOrSaleMerchant = merchantIntegrals[i].buyOrSaleMerchant.substring(0, 4)
            if (allianceIntegrals[i].buyOrSaleMerchant.length != 32) {
                buyOrSaleObject == "会员"
            }
            if (buyOrSaleMerchant == "1111") {
                buyOrSaleObject == "平台"
            }
            if (buyOrSaleMerchant == "2222") {
                buyOrSaleObject == "商圈"
            }
            if (buyOrSaleMerchant == "3333") {
                buyOrSaleObject == "租户"
            }
            let allianceJson = {
                allianceIntegralsId: {
                    name: "商圈积分的Id",
                    value: allianceIntegrals[i].allianceIntegralsId
                },
                alliancesId: {
                    name: "商圈Id",
                    value: allianceIntegrals[i].alliancesId
                },
                alliancesName: {
                    name: "商圈",
                    value: alliances.name
                },
                buyOrSale: {
                    name: "积分交易商",
                    value: allianceIntegrals[i].buyOrSale == 0 ? "买入商" : "卖出商"
                },
                buyOrSaleMerchant: {
                    name: "交易对象" + buyOrSaleObject,
                    value: allianceIntegrals[i].buyOrSaleMerchant
                },
                price: {
                    name: "金额",
                    value: allianceIntegrals[i].price
                },
                integral: {
                    name: "积分",
                    value: allianceIntegrals[i].integral
                }
            }
            alliancesArray.push(allianceJson)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, alliancesArray)

    }
}

