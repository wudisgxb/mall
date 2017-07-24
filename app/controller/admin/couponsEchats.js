
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Vip = db.models.Vips;
let vipss = require('../admin/vip')
let getCouponsEchats = require('../echats/couponsEchats')
module.exports = {
    async couponsEchats(ctx,next){
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('startTime').notEmpty()
        ctx.checkBody('endTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body;
        if(ctx.errors){
            ctx.body=new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors);
            return;
        }
        let couponsEchats = await getCouponsEchats.getCoupons(body.tenantId,body.startTime,body.endTime,body.type)
        
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS,couponsEchats)
    }
}