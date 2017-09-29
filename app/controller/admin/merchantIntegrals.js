const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const sqlMerchantIntegrals = require('../merchantIntegrals/merchantIntegrals')

let Tool = require('../../Tool/tool');

module.exports = {
    async saveMerchantIntegrals(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('vipLevel').notEmpty();
        ctx.checkBody('priceIntegralsRate').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return
        }
        let body = ctx.request.body
        let whereJson = {
            tenantId: body.tenantId,
            vipLevel: body.vipLevel,
            priceIntegralsRate: body.priceIntegralsRate,
        }
        let jsonIntegrals = {
            tenantId: body.tenantId,
        }
        let merchantIntegrals = await sqlMerchantIntegrals.getMerchantIntegrals(jsonIntegrals);
        if (merchantIntegrals != null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "已有此商家信息")
            return;
        }
        await sqlMerchantIntegrals.saveMerchantIntegrals(whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    async updateMerchantIntegrals(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('priceIntegralsRate').notEmpty();
        ctx.checkBody('vipLevel').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return
        }
        let body = ctx.request.body
        let integralsJson = {
            priceIntegralsRate: body.priceIntegralsRate,
            vipLevel: body.vipLevel,
        }
        let whereJson = {
            tenantId: body.tenantId,
        }
        let merchantIntegrals = await sqlMerchantIntegrals.getMerchantIntegrals(whereJson);
        if (merchantIntegrals == null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "找不到此商家")
            return;
        }
        await sqlMerchantIntegrals.updateMerchantIntegrals(integralsJson, whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    async getMerchantIntegrals(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        // ctx.checkBody('priceIntegralsRate').notEmpty();
        // ctx.checkBody('looseChange').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return
        }

        let whereJson = {
            tenantId: ctx.query.tenantId,
        }
        let merchantIntegrals = await sqlMerchantIntegrals.getMerchantIntegrals(whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, merchantIntegrals);
    },

    async getMerchantIntegralsAll(ctx, next){
        // ctx.checkQuery('tenantId').notEmpty();
        // ctx.checkBody('priceIntegralsRate').notEmpty();
        // ctx.checkBody('looseChange').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return
        }

        let whereJson = {}
        let merchantIntegrals = await sqlMerchantIntegrals.getMerchantIntegralsAll(whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, merchantIntegrals);
    }


}
