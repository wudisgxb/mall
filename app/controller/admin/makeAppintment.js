const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const sqlMakeAppintment = require('../makeAppintment/makeAppintment')
let db = require('../../db/mysql/index');
let MakeAppintments = db.models.MakeAppintments

let Tool = require('../../Tool/tool');

module.exports = {
    //查询所有剩余的桌子
    async getMakeAppintmentTimeByStatus(ctx,next){
        ctx.checkQuery('makeAppintmentStartTime').notEmpty();
        ctx.checkQuery('makeAppintmentEndTime').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        //首先根据tenantId查询TableMakeAppintment表中的所有记录
        let tableMakeAppintmentJson = {
            tenantId : ctx.query.tenantId,
            makeAppintmentStartTime : ctx.query.makeAppintmentStartTime,
            makeAppintmentEndTime : ctx.query.makeAppintmentStartTime,
        }
        let tableMakeAppintment = await sqlMakeAppintment.getMakeAppintmentAll(tableMakeAppintmentJson)

        let tableMakeAppintmentArray = []
        for(let i = 0; i < tableMakeAppintment.length; i++){
            tableMakeAppintmentArray.push(tableMakeAppintment[i].tableId)
        }
        let whereJson = {
            tenantId : ctx.query.tenantId,
            id : {
                $notIn : tableMakeAppintmentArray
            }
        }
        let table = await sqlMakeAppintment.table(whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,table)
    },
    //查询当前租户下所有的预约信息
    async getMakeAppintmentTimeBytenantId(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        //首先根据tenantId查询TableMakeAppintment表中的所有记录
        let tableMakeAppintmentJson = {
            tenantId : ctx.query.tenantId,
        }
        let tableMakeAppintment = await sqlMakeAppintment.getMakeAppintmentAll(tableMakeAppintmentJson)

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,tableMakeAppintment)
    },
    //查询当前租户下自己客户的预约信息
    async getMakeAppintmentTimeByStatus(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('Phone').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        
        let tableMakeAppintmentJson = {
            tenantId : ctx.query.tenantId,
            phone : ctx.query.phone
        }
        let tableMakeAppintment = await sqlMakeAppintment.getMakeAppintmentAll(tableMakeAppintmentJson)

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,tableMakeAppintment)
    },
    //新增
    async saveMakeAppintment(ctx,next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('phone').notEmpty();
        ctx.checkBody('makeAppintmentPeopleNumber').notEmpty();
        ctx.checkBody('makeAppintmentTableId').notEmpty();
        ctx.checkBody('makeAppintmentStartTime').notEmpty();
        ctx.checkBody('makeAppintmentEndTime').notEmpty();
        ctx.checkBody('status').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;

        let makeAppintmentId = Tool.allocTenantId()
        let conditionJson ={
            makeAppintmentId : makeAppintmentId,
            tenantId : body.tenantId,
            phone : body.phone,
            makeAppintmentPeopleNumber : body.makeAppintmentPeopleNumber,
            makeAppintmentTableId : body.makeAppintmentTableId,
            makeAppintmentStartTime : body.makeAppintmentStartTime,
            makeAppintmentEndTime : body.makeAppintmentEndTime,
            status : body.status
        }
        await MakeAppintments.create(conditionJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async updateMakeAppintment(ctx,next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('phone').notEmpty();
        ctx.checkBody('makeAppintmentPeopleNumber').notEmpty();
        ctx.checkBody('makeAppintmentTableId').notEmpty();
        ctx.checkBody('makeAppintmentStartTime').notEmpty();
        ctx.checkBody('makeAppintmentEndTime').notEmpty();
        ctx.checkBody('status').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;

        //判断此租户所有可预约状态下的桌子
        // let tableJson = {
        //     tenantId : body.tenantId,
        //     isMakeAppintment : 1
        // }
        // let table = await sqlMakeAppintment.table(tableJson)
        // if(table==null){
        //     ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"在此商户下找不到这个桌子")
        // }

        let conditionJson ={
            makeAppintmentPeopleNumber : body.makeAppintmentPeopleNumber,
            makeAppintmentTableId : body.makeAppintmentTableId,
            makeAppintmentTime : body.makeAppintmentTime,
            status : body.status
        }
        let whereJson = {
            tenantId : body.tenantId,
            phone : body.phone,
            makeAppintmentId : body.makeAppintmentId,
        }
        await sqlMakeAppintment.updateMakeAppintment(conditionJson,whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async deleteMakeAppintment(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('phone').notEmpty();
        ctx.checkQuery('makeAppintmentId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }

        let whereJson = {
            tenantId : body.tenantId,
            phone : body.phone,
            makeAppintmentId : body.makeAppintmentId,
        }
        let getMakeAppintment = await sqlMakeAppintment.getMakeAppintment(whereJson)
        if(getMakeAppintment==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此预约号")
            return;
        }
        await sqlMakeAppintment.deleteMakeAppintment(getMakeAppintment)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

}

