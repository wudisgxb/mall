const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Vip = db.models.Vips;

let getConsumptionEchats = require('../echats/consumptionEchats')
module.exports = {
    async consumptionEchats(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('endTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let consumption = await getConsumptionEchats.getConsumption(body.tenantId, body.startTime, body.endTime, body.type);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, consumption);
    }
}
