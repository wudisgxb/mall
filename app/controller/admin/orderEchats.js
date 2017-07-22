
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let getPaymentHistoryEchats = require('../echats/orderEchats')
let db = require('../../db/mysql/index');

module.exports = {
    async getOrderEchats(ctx,next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('endTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body;
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors)
        }
        let getOrderEchats = await getPaymentHistoryEchats.getPaymentHistory(body.tenantId,body.startTime,body.endTime,body.type);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,getOrderEchats)
    }
}
