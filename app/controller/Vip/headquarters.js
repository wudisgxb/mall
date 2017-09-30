const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const Headquarters = db.models.Headquarters;
const Tool = require('../../Tool/tool');
const headQuarters = require('../businessAlliance/headquarters')


module.exports = {
    async saveHeadQuarters(ctx,next){
        ctx.checkBody('name').notEmpty()
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('industry').notEmpty()
        ctx.checkBody('wecharPayee_account').notEmpty()
        ctx.checkBody('payee_account').notEmpty()
        ctx.checkBody('homeImage').notEmpty()
        ctx.checkBody('longitude').notEmpty()
        ctx.checkBody('latitude').notEmpty()
        ctx.checkBody('headquartersId').notEmpty()

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let whereJson = {
            name : body.name,
            phone : body.phone
        }
        let headquarter = await headQuarters.getHeadquarter(whereJson);
        if(headquarter!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"已经有当前平台了")
            return
        }
        // console.log(headquarter)
        // let headquartersId = Tool.allocTenantId()
        // let headquarters = "1111"+headquartersId.substring(4);
        // console.log(headquarters)

        let createJson = {
            name : body.name,
            phone : body.phone,
            industry : body.industry,
            headquartersId : body.headquartersId,
            wecharPayee_account : body.wecharPayee_account,
            payee_account : body.payee_account,
            homeImage : body.homeImage,
            longitude : body.longitude,
            latitude : body.latitude,
            aggregateScore : 0
        }
        // await Headquarters.create(createJson)

        await headQuarters.createHeadquarter(createJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async updateHeadQuarters(ctx,next){
        ctx.checkBody('name').notEmpty()
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('industry').notEmpty()
        ctx.checkBody('wecharPayee_account').notEmpty()
        ctx.checkBody('payee_account').notEmpty()
        ctx.checkBody('homeImage').notEmpty()
        ctx.checkBody('longitude').notEmpty()
        ctx.checkBody('latitude').notEmpty()
        ctx.checkBody('headquartersId').notEmpty()
        ctx.checkBody('aggregateScore').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let whereJson = {
            headquartersId : body.headquartersId
        }
        let headquarter = await headQuarters.getHeadquarter(whereJson);
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
        await headQuarters.updateHeadquarter(updateJson,whereJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async deleteHeadQuarters(ctx,next){
        ctx.checkQuery('headquartersId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            headquartersId : ctx.query.headquartersId
        }
        let headquarter = await headQuarters.getHeadquarter(whereJson);
        if(headquarter==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个平台Id")
            return
        }
        // console.log(headquarter)
        await headQuarters.deleteHeadquarter(whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //根据HeadquartersId查询平台信息
    async getHeadQuarters(ctx,next){
        ctx.checkQuery('headquartersId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            headquartersId : ctx.query.headquartersId
        }
        let headquarter = await headQuarters.getHeadquarter(whereJson);
        if(headquarter==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个平台Id")
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,headquarter)
    },
    // //根据HeadquartersId查询商圈信息
    // async getHeadQuarters(ctx,next){
    //     ctx.checkQuery('headquartersId').notEmpty()
    //     if(ctx.errors){
    //         ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
    //         return;
    //     }
    //     let whereJson = {
    //         headquartersId : ctx.query.headquartersId
    //     }
    //     let headquarter = await headQuarters.getHeadquarter(whereJson);
    //     if(headquarter==null){
    //         ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个平台Id")
    //         return
    //     }
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS,headquarter)
    // },
    async getHeadQuartersByName(ctx,next){
        ctx.checkQuery('name').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            name : ctx.query.name
        }
        let headquarter = await headQuarters.getHeadquarter(whereJson);
        if(headquarter==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个平台Id")
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,headquarter)
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