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
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,'有该租户的基本信息！');
        }
        

    },
    //新增租户信息
    async saveTenantInfoByTenantId(ctx, next){
        ctx.checkBody('/tenantConfig/wecharPayee_account',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/payee_account',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/isRealTime',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipFee',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipRemindFee',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/image',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/startTime',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/endTime',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let tenantInfo = await TenantConfigs.findAll({
            where: {
                tenantId: body.condition.tenantId,
            }
        })
        if(tenantInfo.length > 0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "未找到租户信息")
            return;
        }
        let TenantConfig
        TenantConfig = await TenantConfigs.create({
            wecharPayee_account:body.tenantConfig.wecharPayee_account,
            payee_account:body.tenantConfig.payee_account,
            isRealTime:body.tenantConfig.isRealTime,
            vipFee:body.tenantConfig.vipFee,
            vipRemindFee:body.tenantConfig.vipRemindFee,
            image:body.tenantConfig.image,
            startTime:body.tenantConfig.startTime,
            endTime:body.tenantConfig.endTime,
            tenantId:body.condition.tenantId,
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)


    },

    //编辑租户信息
    async updateTenantInfoByTenantId(ctx, next){
        ctx.checkBody('/tenantConfig/wecharPayee_account',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/payee_account',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/isRealTime',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipFee',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipRemindFee',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/image',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/startTime',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/endTime',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let tenantInfo = await TenantConfigs.findAll({
            where: {
                tenantId: body.condition.tenantId,
            }
        })
        if(tenantInfo.length <= 0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "未找到租户信息")
            return;
        }
        let TenantConfig
        let TenantConfigss = await TenantConfigs.findById(tenantInfo[0].id)
        if(TenantConfigss!=null){
            TenantConfigss.wecharPayee_account = body.tenantConfig.wecharPayee_account;
            TenantConfigss.payee_account = body.tenantConfig.payee_account;
            TenantConfigss.isRealTime = body.tenantConfig.isRealTime;
            TenantConfigss.vipFee = body.tenantConfig.vipFee;
            TenantConfigss.vipRemindFee = body.tenantConfig.vipRemindFee;
            TenantConfigss.image = body.tenantConfig.image;
            TenantConfigss.startTime = body.tenantConfig.startTime;
            TenantConfigss.endTime = body.tenantConfig.endTime;
            TenantConfigss.tenantId = body.condition.tenantId;
            await TenantConfigss.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)


    }



}