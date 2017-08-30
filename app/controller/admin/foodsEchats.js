const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let getFoodEchats = require('../echats/foodsEchats')
let db = require('../../db/mysql/index');
module.exports = {
    async savefoodEchats(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR);
        }
        let result = await getFoodEchats.getfEchats(body.tenantId, body.startTime, body.type);
        if (result.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, "找不到数据");
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result);
    },

    async savefoodsEchats(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        let body = ctx.request.body
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR);
        }
        let date = new Date()
        date.setDate(date.getDate() - 1)
        let startTime = date.format("yyyy-MM-dd 00:00:00")
        // console.log(startTime);
        let result = await getFoodEchats.getfEchats(body.tenantId, startTime, 1);
        if (result.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, "找不到数据");
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result);
    }
}
