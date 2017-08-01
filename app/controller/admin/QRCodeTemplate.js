const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const QRCodeTemplates = db.models.QRCodeTemplates;
const Tool = require('../../Tool/tool');

module.exports = {

    async saveQRCodeTemplate (ctx, next) {
        ctx.checkBody('bizType').notEmpty();
        ctx.checkBody('tableName').notEmpty();
        ctx.checkBody('coupons').notEmpty()
        ctx.checkBody('couponRate').notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;

        let QRCodeTemplateId = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);
        let couponType;
        let couponValue;
        if(body.coupons.length==0){
            await QRCodeTemplates.create({
                QRCodeTemplateId: QRCodeTemplateId,
                bizType: body.bizType,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                tableName: body.tableName,
                couponRate: body.couponRate,
            });
        }
        for (let i = 0; i<body.coupons.length;i++){
            couponType =body.coupons[i].couponType
            couponValue = body.coupons[i].couponValue
            await QRCodeTemplates.create({
                QRCodeTemplateId: QRCodeTemplateId,
                bizType: body.bizType,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                tableName: body.tableName,
                couponType: couponType,
                couponValue: couponValue,
                couponRate: body.couponRate,
            });
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,QRCodeTemplateId);
    },
    async updateQRCodeTemplate (ctx, next) {
        ctx.checkBody('/condition/QRCodeTemplateId', true).first().notEmpty();

        ctx.checkBody('/QRCodeTemplate/bizType', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/tableName', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/couponType', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/couponValue', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/couponRate', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/tenantId', true).first().notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body;
        let qrCodeTemplate = await QRCodeTemplates.findOne({
            where: {
                QRCodeTemplateId: body.condition.QRCodeTemplateId,
            }
        })
        if (qrCodeTemplate != null) {
            qrCodeTemplate.bizType = body.QRCodeTemplate.bizType;
            qrCodeTemplate.tableName = body.QRCodeTemplate.tableName;
            qrCodeTemplate.couponType = body.QRCodeTemplate.couponType;
            qrCodeTemplate.couponValue = body.QRCodeTemplate.couponValue;
            qrCodeTemplate.couponRate = body.QRCodeTemplate.couponRate;
            qrCodeTemplate.tenantId = body.QRCodeTemplate.tenantId;
            qrCodeTemplate.consigneeId = body.QRCodeTemplate.consigneeId;
            await qrCodeTemplate.save();
        } else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '二维码模板不存在！');
            return;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getQRCodeTemplate (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let qrCodeTemplates = await QRCodeTemplates.findAll({
            where: {
                tenantId: ctx.query.tenantId,
            }
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,qrCodeTemplates);
    },
    async deleteQRCodeTemplate(ctx, next){
        ctx.checkQuery('QRCodeTemplateId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let qrCodeTemplate = await QRCodeTemplates.findOne({
            where: {
                QRCodeTemplateId: ctx.query.QRCodeTemplateId,
            }
        });
        if (qrCodeTemplate == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '二维码模板不存在！无需删除！');
            return;
        }
        await qrCodeTemplate.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }
}


