const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const QRCodeTemplates = db.models.QRCodeTemplates;
const Merchants = db.models.Merchants;
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



        let qrCode = {};
        let qrCodes = [];

        let tenantIdArray = [];//根据租户分组

        let coupons = [];
        qrCodeTemplates.forEach(function (e) {
            if (!tenantIdArray.contains(e.tenantId)) {
                tenantIdArray.push(e.tenantId);
            }
        })

        for (var i = 0; i < tenantIdArray.length; i++) {
            coupons = [];
            //获取租户名称
            let merchant = await Merchants.findOne({
                where: {
                    tenantId: tenantIdArray[i],
                }
            })
            for (var j = 0; j < qrCodeTemplates.length; j++) {
                if (tenantIdArray[i] == qrCodeTemplates[j].tenantId) {
                    qrCode = new Object();
                    qrCode.QRCodeTemplateId = qrCodeTemplates[j].QRCodeTemplateId;
                    qrCode.tableName = qrCodeTemplates[j].tableName;
                    qrCode.bizType = qrCodeTemplates[j].bizType;
                    if (qrCodeTemplates[j].couponRate != null) {
                        qrCode.couponRate = qrCodeTemplates[j].couponRate;
                    }
                    qrCode.tenantId = qrCodeTemplates[j].tenantId;
                    qrCode.merchantName = merchant.name;
                    qrCode.industry = merchant.industry;
                    qrCode.consigneeId = qrCodeTemplates[j].consigneeId;
                    if (qrCodeTemplates[j].couponType != null && qrCodeTemplates[j].couponValue != null) {
                        coupons.push({"couponType": qrCodeTemplates[j].couponType, "couponValue": qrCodeTemplates[j].couponValue})
                    }
                }
            }
            if (coupons.length > 0) {
                qrCode.coupons = coupons;
            }
            qrCodes.push(qrCode);
        }

        if (qrCodes.length == 1) {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCodes[0]);
        } else {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCodes);
        }
    },
}