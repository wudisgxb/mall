const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const AllianceMerchants = db.models.AllianceMerchants;
const Merchants = db.models.Merchants
const Alliances = db.models.Alliances
const Tool = require('../../Tool/tool');
const sqlAllianceMerchants = require('../businessAlliance/allianceMerchants')
const sqlAlliances = require('../businessAlliance/alliances')
const sqlHeadquarters = require('../businessAlliance/headquarters')


module.exports = {
    async saveAllianceMerchants(ctx,next){
        ctx.checkBody('alliancesId').notEmpty()
        ctx.checkBody('tenantId').notEmpty()
        // ctx.checkBody('alliancesRemark').notEmpty()
        // ctx.checkBody('tenantRemark').notEmpty()
        // ctx.checkBody('tenantRate').notEmpty()
        // ctx.checkBody('headquartersRate').notEmpty()
        // ctx.checkBody('allianceRate').notEmpty()
        // ctx.checkBody('alliancesName').notEmpty()
        // ctx.checkBody('tenantName').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let whereJson = {
            alliancesId : body.alliancesId,
            tenantId : body.tenantId
        }
        let allianceMerchants = await sqlAllianceMerchants.getOperation(AllianceMerchants,whereJson);
        let alliance = await sqlAllianceMerchants.getOperation(Alliances,{alliancesId : whereJson.alliancesId})
        if(alliance==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到当前商户联盟")
            return
        }
        let tenants = await sqlAllianceMerchants.getOperation(Merchants,{tenantId : whereJson.tenantId})
        if(tenants==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到当前租户")
            return
        }
        if(allianceMerchants!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"已经有当前配置信息了")
            return
        }
        // if(Number(body.allianceRate)+Number(body.headquartersRate)+Number(body.tenantRate)!=1){
        //     ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,"分润比例不合理")
        //     return
        // }
        let createJson = {
            alliancesId : body.alliancesId,
            tenantId : body.tenantId,
            allianceRemark : alliance.name+"商圈",
            tenantRemark :tenants.name+"租户",
            // headquartersRate : body.headquartersRate,
            // tenantRate : body.tenantRate,
            // allianceRate : body.allianceRate,
            tenantName : tenants.name,
            allianceName : alliance.name
        }
        // await Headquarters.create(createJson)
        await sqlAllianceMerchants.createOperation(AllianceMerchants,createJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async saveAllianceMerchantsBytenantId(ctx,next){
        let merchants = await Merchants.findAll({})
        for(let i = 0; i < merchants.length; i++){
            // AllianceMerchants.create({
            //     alliancesId : ,
            //     tenantId :merchants[i].tenantId,
            //     allianceRemark : "商圈",
            //     tenantRemark : merchants[i].name+"租户",
            //     tenantName : merchants[i].name,
            //     allianceName :
            // })
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async updateAllianceMerchants(ctx,next){
        ctx.checkBody('id').notEmpty()
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('alliancesId').notEmpty()
        // ctx.checkBody('alliancesRemark').notEmpty()
        // ctx.checkBody('tenantRemark').notEmpty()
        // ctx.checkBody('tenantRate').notEmpty()
        // ctx.checkBody('headquartersRate').notEmpty()
        // ctx.checkBody('allianceRate').notEmpty()
        // ctx.checkBody('alliancesName').notEmpty()
        // ctx.checkBody('tenantName').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let whereJson = {
            id : body.id
        }
        let allianceMerchants = await sqlAllianceMerchants.getOperation(AllianceMerchants,whereJson);
        if(allianceMerchants==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没找到当前配置信息")
            return
        }
        let alliance = await sqlAllianceMerchants.getOperation(Alliances,{alliancesId : body.alliancesId})
        if(alliance==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到当前商户联盟")
            return
        }
        let tenants = await sqlAllianceMerchants.getOperation(Merchants,{tenantId : body.tenantId})
        if(tenants==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到当前租户")
            return
        }

        // if(Number(body.allianceRate)+Number(body.headquartersRate)+Number(body.tenantRate)!=1){
        //     ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,"分润比例不合理")
        //     return
        // }
        let updateJson = {
            alliancesId : body.alliancesId,
            tenantId : body.tenantId,
            allianceRemark : alliance.name+"商圈",
            tenantRemark :tenants.name+"租户",
            // headquartersRate : body.headquartersRate,
            // tenantRate : body.tenantRate,
            // allianceRate : body.allianceRate,
            tenantName : tenants.name,
            allianceName : alliance.name,
        }
        await sqlAllianceMerchants.updateOperation(AllianceMerchants,updateJson,whereJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async deleteAllianceMerchants(ctx,next){
        ctx.checkQuery('alliancesId').notEmpty()
        ctx.checkQuery('tenantId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            alliancesId : ctx.query.alliancesId,
            tenantId : ctx.query.tenantId
        }
        let allianceMerchants = await sqlAllianceMerchants.getOperation(AllianceMerchants,whereJson);
        // console.log(allianceMerchants)
        if(allianceMerchants==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个配置")
            return
        }
        await sqlAllianceMerchants.deleteOperation(AllianceMerchants,whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getAllianceMerchants(ctx,next){
        ctx.checkQuery('tenantId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            tenantId : ctx.query.tenantId
        }
        let allianceMerchant = await sqlAllianceMerchants.getOperation(AllianceMerchants,whereJson);
        if(allianceMerchant==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个商圈Id")
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,allianceMerchant)
    },
    async getAllianceMerchantsByAllianceId(ctx,next){
        ctx.checkQuery('alliancesId').notEmpty()
        if(ctx.errors){
        ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
        return;
    }
        let whereJson = {
            alliancesId : ctx.query.alliancesId
        }
        let allianceMerchant = await sqlAllianceMerchants.getOperations(AllianceMerchants,whereJson);
        if(allianceMerchant.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"这个商圈下没有租户")
            return
        }
        let merchantArray = []
        for(let i = 0; i < allianceMerchant.length; i++){
            let merchant = await Merchants.findOne({
                where:{
                    tenantId : allianceMerchant[i].tenantId
                }
            })
            merchantArray.push(merchant)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,merchantArray)
    },
}
