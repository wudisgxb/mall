const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const AllianceSetIntegrals = db.models.AllianceSetIntegrals;
const Tool = require('../../Tool/tool');
// const headQuarters = require('../businessAlliance/headquarters')


module.exports = {
    async saveAllianceSetIntegral(ctx,next){
        ctx.checkBody('alliancesId').notEmpty()
        ctx.checkBody('priceIntegralsRate').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        // let whereJson = {
        //     alliancesId : body.alliancesId
        // }
        // console.log(AllianceSetIntegrals)
        let headquartersSetIntegrals = await AllianceSetIntegrals.findOne({
            where:{
                alliancesId : body.alliancesId
            }
        });
        // console.log(headquartersSetIntegrals)
        if(headquartersSetIntegrals!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"已经有当前平台的设置，请执行修改操作")
            return
        }
        // console.log(headquarter)
        // let headquartersId = Tool.allocTenantId()
        // let headquarters = "1111"+headquartersId.substring(4);
        // console.log(headquarters)

        let createJson = {
            alliancesId : body.alliancesId,
            priceIntegralsRate : body.priceIntegralsRate,
        }
        // await Headquarters.create(createJson)
        await AllianceSetIntegrals.create(createJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async updateAllianceSetIntegral(ctx,next){
        ctx.checkBody('alliancesId').notEmpty()
        ctx.checkBody('priceIntegralsRate').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let allianceSetIntegrals = await AllianceSetIntegrals.findOne({
            where:{
                alliancesId : body.alliancesId
            }
        });

        if(allianceSetIntegrals==null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"没有当前商圈的配置")
            return
        }

        let createJson = {
            priceIntegralsRate : body.priceIntegralsRate,
        }

        await AllianceSetIntegrals.update(createJson,{
            where:{
                alliancesId : body.alliancesId
            }
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getAllianceSetIntegral(ctx,next){
        ctx.checkQuery('alliancesId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }

        let allianceSetIntegrals = await AllianceSetIntegrals.findOne({
            where:{
                alliancesId : ctx.query.alliancesId
            }
        });

        if(allianceSetIntegrals==null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"没有当前商圈的配置")
            return
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,allianceSetIntegrals)
    },

    // async getHeadQuartersId(ctx,next){
    //     let headQuarters = await Headquarters.findAll({})
    //     let headQuartersArray = []
    //     for(let i = 0; i < headQuarters.length; i++){
    //         let headQuartersLength = headQuarters[i].headquartersId.length
    //         headQuartersArray.push(headQuartersLength)
    //     }
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS,headQuartersArray)
    // },


}
