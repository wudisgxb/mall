const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Profitsharings =  db.models.ProfitSharings;



module.exports = {
    //根据TenantId查询所有代售点信息
    async getAdminProfitsharingsByTenantId(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }
        let profitsharing = await Profitsharings.findAll({
            where:{
                tenantId:ctx.query.tenantId
            }
        });
        if(profitsharing==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"未找到代售点" );
            return;
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,profitsharing);


    }
}