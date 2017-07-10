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
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,'没有该租户的基本信息！');
        }
        

    },
    //新增租户信息
    async saveTenantInfo(ctx, next){
        ctx.checkBody('/tenantConfig/name',true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('/tenantConfig/wecharPayee_account',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/payee_account',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/isRealTime',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipFee',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipRemindFee',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/homeImage',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/startTime',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/endTime',true).first().notEmpty();

        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let tenantInfo = await TenantConfigs.findAll({
            where: {
                tenantId: body.tenantId
            }
        })
        if(tenantInfo.length > 0){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "已有租户信息");
            return;
        }

        let TenantConfig
        TenantConfig = await TenantConfigs.create({
            wecharPayee_account:body.tenantConfig.wecharPayee_account,
            payee_account:body.tenantConfig.payee_account,
            isRealTime:body.tenantConfig.isRealTime,
            vipFee:body.tenantConfig.vipFee,
            vipRemindFee:body.tenantConfig.vipRemindFee,
            homeImage:body.tenantConfig.homeImage,
            startTime:body.tenantConfig.startTime,
            endTime:body.tenantConfig.endTime,
            tenantId:body.tenantId,
            name:body.tenantConfig.name
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
        ctx.checkBody('/tenantConfig/homeImage',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/startTime',true).first().notEmpty()
        ctx.checkBody('/tenantConfig/name',true).first().notEmpty();
        ctx.checkBody('/tenantConfig/endTime',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let TenantConfig = await TenantConfigs.findOne({
            where: {
                tenantId: body.condition.tenantId,
            }
        })

        if(TenantConfig == null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "未找到租户信息")
            return;
        }

        TenantConfig.wecharPayee_account = body.tenantConfig.wecharPayee_account;
        TenantConfig.payee_account = body.tenantConfig.payee_account;
        TenantConfig.isRealTime = body.tenantConfig.isRealTime;
        TenantConfig.vipFee = body.tenantConfig.vipFee;
        TenantConfig.vipRemindFee = body.tenantConfig.vipRemindFee;
        TenantConfig.homeImage = body.tenantConfig.homeImage;
        TenantConfig.startTime = body.tenantConfig.startTime;
        TenantConfig.endTime = body.tenantConfig.endTime;
        TenantConfig.name = body.tenantConfig.name;
        TenantConfig.tenantId = body.condition.tenantId;
        await TenantConfig.save();

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }



}