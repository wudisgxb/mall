const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let ClienteleIntegrals = db.models.ClienteleIntegrals
let table = db.models.Tables
let Tool = require('../../Tool/tool');
const sqlClienteleIntegrals = require('../clienteleIntegrals/clienteleIntegrals')


module.exports = {
    async updateClienteleIntegrals(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('phone').notEmpty();
        ctx.checkBody('integralnum').notEmpty();
        ctx.checkBody('price').notEmpty();
        ctx.checkBody('goodsName').notEmpty();
        ctx.checkBody('integralId').notEmpty();
        
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let updateJson = {
            tenantId: body.tenantId,
            phone: body.phone,
            integralnum: body.integralnum,
            price: body.price,
            integralTime: new Date(),
            goodsName: body.goodsName,

        }
        let whereJson = {
            integralId: body.integralId,
        }
        await sqlClienteleIntegrals.updateClienteleIntegral(updateJson,whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async saveClienteleIntegrals(ctx, next){

        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('phone').notEmpty();
        ctx.checkBody('integralnum').notEmpty();
        ctx.checkBody('price').notEmpty();
        ctx.checkBody('goodsName').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let integralId = Tool.allocTenantId();

        let whereJson = {
            tenantId: body.tenantId,
            phone: body.phone,
            integralnum: body.integralnum,
            price: body.price,
            integralTime: new Date(),
            goodsName: JSON.stringify(body.goodsName),
            integralId : integralId
        }
        console.log(whereJson)
        await ClienteleIntegrals.create(whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,integralId)
    },
    async getClienteleIntegralsBytenantIdAndPhone(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('phone').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        //页码
        let pageNumber = parseInt(ctx.query.pageNumber);
        //每页显示的大小
        let pageSize = parseInt(ctx.query.pageSize);
        let place = (pageNumber - 1) * pageSize;

        let whereJson = {
            tenantId: ctx.query.tenantId,
            phone: ctx.query.phone
        }
        let limitJson={
            limit : pageSize,
            offset : place
        }
        let IntegralArray=[]
        let ClienteleIntegralsByTenantId = await sqlClienteleIntegrals.getClienteleIntegralAll(whereJson,limitJson)
        for(let i =0;i<ClienteleIntegralsByTenantId.length;i++){
            let IntegralJson = {
                integralId : ClienteleIntegralsByTenantId[i].integralId,
                tenantId : ClienteleIntegralsByTenantId[i].tenantId,
                phone : ClienteleIntegralsByTenantId[i].phone,
                integralnum : ClienteleIntegralsByTenantId[i].integralnum,
                price : ClienteleIntegralsByTenantId[i].price,
                integralTime : ClienteleIntegralsByTenantId[i].integralTime,
                goodsName : JSON.parse(ClienteleIntegralsByTenantId[i].goodsName),
            }
            IntegralArray.push(IntegralJson)
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, IntegralArray)
    },
    async getClienteleIntegralsByPhone(ctx, next){
        ctx.checkQuery('phone').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        //页码
        let pageNumber = parseInt(ctx.query.pageNumber);
        //每页显示的大小
        let pageSize = parseInt(ctx.query.pageSize);
        let place = (pageNumber - 1) * pageSize;

        let whereJson = {
            phone: ctx.query.phone
        }
        let ClienteleIntegralsByTenantId = await sqlClienteleIntegrals.getClienteleIntegralAll(whereJson)
        let IntegralArray = []
        for(let i =0;i<ClienteleIntegralsByTenantId.length;i++){
            let IntegralJson = {
                integralId : ClienteleIntegralsByTenantId[i].integralId,
                tenantId : ClienteleIntegralsByTenantId[i].tenantId,
                phone : ClienteleIntegralsByTenantId[i].phone,
                integralnum : ClienteleIntegralsByTenantId[i].integralnum,
                price : ClienteleIntegralsByTenantId[i].price,
                integralTime : ClienteleIntegralsByTenantId[i].integralTime,
                goodsName : JSON.parse(ClienteleIntegralsByTenantId[i].goodsName),
            }
            IntegralArray.push(IntegralJson)
        }
        if (ClienteleIntegralsByTenantId.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "您还没有成为任何商户的会员")
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, IntegralArray)
    },
    async getClienteleIntegralsByTenantId(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let whereJson = {
            tenantId: ctx.query.tenantId
        }
        let ClienteleIntegralsByTenantId = await sqlClienteleIntegrals.getClienteleIntegralAll(whereJson)
        if (ClienteleIntegralsByTenantId.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "您还没有任何消费的客户")
            return
        }
        let IntegralArray = []
        for(let i =0;i<ClienteleIntegralsByTenantId.length;i++){
            let IntegralJson = {
                integralId : ClienteleIntegralsByTenantId[i].integralId,
                tenantId : ClienteleIntegralsByTenantId[i].tenantId,
                phone : ClienteleIntegralsByTenantId[i].phone,
                integralnum : ClienteleIntegralsByTenantId[i].integralnum,
                price : ClienteleIntegralsByTenantId[i].price,
                integralTime : ClienteleIntegralsByTenantId[i].integralTime,
                goodsName : JSON.parse(ClienteleIntegralsByTenantId[i].goodsName),
            }
            IntegralArray.push(IntegralJson)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, IntegralArray)
    },
    async getClienteleIntegralsByCount(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('phone').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let whereJson = {
            tenantId: ctx.query.tenantId,
            phone: ctx.query.phone,
        }
        let ClienteleIntegralsByTenantId = await sqlClienteleIntegrals.getClienteleIntegralSum(whereJson)

        // if (ClienteleIntegralsByTenantId.length == 0) {
        //     ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "此商户下没有该客户的任何消费积分")
        //     return;
        // }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, ClienteleIntegralsByTenantId)
    },

}


