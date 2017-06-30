const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const TenantConfigs = db.models.TenantConfigs;

module.exports = {

    async getTenantInfoByTenantId (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        var tenantInfo = await TenantConfigs.findOne({
            where: {
                tenantId: ctx.query.tenantId,
            }
        })

        if (tenantInfo != null) {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS,tenantInfo);
        } else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,'未找到租户基本信息！');
        }
        

    }

}