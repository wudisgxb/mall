const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const QRCodeTemplates = db.models.QRCodeTemplates;
const TenantConfigs = db.models.TenantConfigs;
const Tool = require('../../Tool/tool');

module.exports = {
    //获取二维码模板
    async getQRCodeTemplate (ctx, next) {
        ctx.checkQuery('QRCodeTemplateId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let qrCodeTemplates = await QRCodeTemplates.findAll({
            where: {
                QRCodeTemplateId: ctx.query.QRCodeTemplateId,
            }
        });

        if (qrCodeTemplates.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "二维码模板未找到！");
            return;
        }

        //获取租户名称
        let tenantInfo = await TenantConfigs.findOne({
            where: {
                tenantId: qrCodeTemplates[0].tenantId,
            }
        })


        let qrCode = {};

        let coupons = [];
        qrCodeTemplates.forEach(function (e) {
            qrCode.QRCodeTemplateId = e.QRCodeTemplateId;
            qrCode.tableName = e.tableName;
            qrCode.bizType = e.bizType;
            if (e.couponRate != null) {
                qrCode.couponRate = e.couponRate;
            }
            qrCode.tenantId = e.tenantId;
            qrCode.merchantName = tenantInfo.name;
            qrCode.consigneeId = e.consigneeId;
            if (e.couponType != null && e.couponValue != null) {
                coupons.push({"couponType" : e.couponType,"couponValue":e.couponValue})
            }
        })

        if (coupons.length > 0) {
            qrCode.coupons = coupons;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCode);
    },
}