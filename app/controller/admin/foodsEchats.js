const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let Echants = require('../echats/foodsEchats')
let db = require('../../db/mysql/index');

module.exports = {
    async savefoodEchats(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('endTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR);
        }
        let result = await Echants.getfEchats(body.tenantId,body.startTime,body.endTime,body.type);
        if(result.length==0){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR);
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,result);
    }

}
