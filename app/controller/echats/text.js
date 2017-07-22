
const ApiResult = require('../../db/mongo/ApiResult')
let dayEchat = require('../echats/dayEchat')

module.exports = {

    async savedayEchat (ctx, next) {
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('endTime').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult()
        }
        let dayEchat = await dayEchat.getDay();
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS,dayEchat)
    }
}
