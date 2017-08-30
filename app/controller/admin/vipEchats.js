const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let getVipEchats = require('../echats/vipEchats')


module.exports = {
    async saveAdminVip(ctx, next){
        // logger.info("1111")
        ctx.checkBody("tenantId").notEmpty();
        ctx.checkBody("startTime").notEmpty();
        ctx.checkBody("endTime").notEmpty();
        ctx.checkBody("type").notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let result = await getVipEchats.getVip(body.tenantId, body.startTime, body.endTime, body.type)
        if (result.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有记录")
            return;
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)

    }
}