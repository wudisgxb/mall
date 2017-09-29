const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const HeadquartersSetIntegrals = db.models.HeadquartersSetIntegrals;
const Tool = require('../../Tool/tool');
// const headQuarters = require('../businessAlliance/headquarters')


module.exports = {
    async saveHeadQuartersSetIntegrals(ctx,next){
        ctx.checkBody('headQuartersId').notEmpty()
        ctx.checkBody('priceIntegralsRate').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }

        let body = ctx.request.body;
        // console.log(body.headQuartersId)
        // console.log(body.priceIntegralsRate)
        let whereJson = {
            headQuartersId : body.headQuartersId
        }
        let headquartersSetIntegrals = await HeadquartersSetIntegrals.findOne({
            where:whereJson
        });
        console.log(headquartersSetIntegrals)
        if(headquartersSetIntegrals!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"已经有当前平台的设置，请执行修改操作")
            return
        }
        // console.log(headquarter)
        // let headquartersId = Tool.allocTenantId()
        // let headquarters = "1111"+headquartersId.substring(4);
        // console.log(headquarters)

        let createJson = {
            headQuartersId : body.headQuartersId,
            priceIntegralsRate : body.priceIntegralsRate,
        }
        // await Headquarters.create(createJson)

        await HeadquartersSetIntegrals.create(createJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async updateHeadQuartersSetIntegrals(ctx,next){
        ctx.checkBody('headQuartersId').notEmpty()
        ctx.checkBody('priceIntegralsRate').notEmpty()
        let body = ctx.request.body
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            headQuartersId : body.headQuartersId
        }
        let headquartersSetIntegrals = await HeadquartersSetIntegrals.findOne({
            where:whereJson
        });
        if(headquartersSetIntegrals==null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"没找到次平台的配置信息")
            return
        }
        let updateJson={
            priceIntegralsRate : body.priceIntegralsRate
        }
        await HeadquartersSetIntegrals.update(updateJson,{where:whereJson})
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getHeadquartersSetIntegrals(ctx,next){
        ctx.checkQuery('headQuartersId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            headQuartersId : ctx.query.headQuartersId
        }
        let headquartersSetIntegrals = await HeadquartersSetIntegrals.findOne({
            where:whereJson
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,headquartersSetIntegrals)
    }

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
