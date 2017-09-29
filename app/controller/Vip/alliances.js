const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const Headquarters = db.models.Headquarters;
const Tool = require('../../Tool/tool');
const sqlAlliances = require('../businessAlliance/alliances')


module.exports = {
    //测试成功
    async saveAlliances(ctx,next){
        ctx.checkBody('name').notEmpty()
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('industry').notEmpty()
        ctx.checkBody('wecharPayee_account').notEmpty()
        ctx.checkBody('payee_account').notEmpty()
        ctx.checkBody('homeImage').notEmpty()
        ctx.checkBody('longitude').notEmpty()
        ctx.checkBody('latitude').notEmpty()
        ctx.checkBody('alliancesId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let whereJson = {
            name : body.name,
            phone : body.phone
        }
        let headquarter = await sqlAlliances.getAlliances(whereJson);
        if(headquarter!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"已经有当前平台了")
            return
        }
        // console.log(headquarter)
        // let alliancesId = Tool.allocTenantId()
        // let alliances = "2222"+alliancesId.substring(4);
        // console.log(headquarters)

        let createJson = {
            name : body.name,
            phone : body.phone,
            industry : body.industry,
            alliancesId : body.alliancesId,
            wecharPayee_account : body.wecharPayee_account,
            payee_account : body.payee_account,
            homeImage : body.homeImage,
            longitude : body.longitude,
            latitude : body.latitude,
            aggregateScore : 0
        }

        // await Headquarters.create(createJson)
        await sqlAlliances.createAlliances(createJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async updateAlliances(ctx,next){
        ctx.checkBody('name').notEmpty()
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('industry').notEmpty()
        ctx.checkBody('wecharPayee_account').notEmpty()
        ctx.checkBody('payee_account').notEmpty()
        ctx.checkBody('homeImage').notEmpty()
        ctx.checkBody('longitude').notEmpty()
        ctx.checkBody('latitude').notEmpty()
        ctx.checkBody('alliancesId').notEmpty()
        ctx.checkBody('aggregateScore').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let whereJson = {
            alliancesId : body.alliancesId
        }
        let headquarter = await sqlAlliances.getAlliances(whereJson);
        console.log(headquarter)
        if(headquarter==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没找到当前平台")
            return
        }

        let updateJson = {
            name : body.name,
            phone : body.phone,
            industry : body.industry,
            wecharPayee_account : body.wecharPayee_account,
            payee_account : body.payee_account,
            homeImage : body.homeImage,
            longitude : body.longitude,
            latitude : body.latitude,
            aggregateScore : body.aggregateScore
        }
        await sqlAlliances.updateAlliances(updateJson,whereJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async deleteAlliances(ctx,next){
        ctx.checkQuery('alliancesId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            alliancesId : ctx.query.alliancesId
        }
        let alliances = await sqlAlliances.getAlliances(whereJson);
        console.log(alliances)
        if(alliances==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个平台Id")
            return
        }
        await sqlAlliances.deleteAlliances(whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getAlliances(ctx,next){
        ctx.checkQuery('alliancesId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            alliancesId : ctx.query.alliancesId
        }
        let alliances = await sqlAlliances.getAlliances(whereJson);
        if(alliances==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个商圈Id")
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,alliances)
    },
    async getAlliancesByName(ctx,next){
        ctx.checkQuery('name').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            name : ctx.query.name
        }
        let alliances = await sqlAlliances.getAlliances(whereJson);
        if(alliances==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个商圈Id")
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,alliances)
    },


}