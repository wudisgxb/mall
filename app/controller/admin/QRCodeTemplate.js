const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const QRCodeTemplates = db.models.QRCodeTemplates;
const Tool = require('../../Tool/tool');

module.exports = {

    async saveAllQRCodeTemplate (ctx, next) {
        // ctx.checkBody('bizType').notEmpty();
        // ctx.checkBody('coupons').notEmpty()
        // ctx.checkBody('couponRate').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        // ctx.checkBody('descriptor').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;

        let qrCodeTemplates = await QRCodeTemplates.findAll({
            where:{
                consigneeId : body.consigneeId
            }
        })
        let qrCodeTemplateId;
        if(qrCodeTemplates.length==0){
            qrCodeTemplateId = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);
        }else if(qrCodeTemplates.length>0){
            qrCodeTemplateId = qrCodeTemplates[0].QRCodeTemplateId
        }
        let couponType;
        let couponValue;
        if (body.coupons.length == 0) {
            await QRCodeTemplates.create({
                QRCodeTemplateId: qrCodeTemplateId,
                bizType: "eshop",
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                tableName: "0号桌",
                descriptor: body.descriptor==null?null:body.descriptor,
            });
        }
        for (let i = 0; i < body.coupons.length; i++) {
            couponType = body.coupons[i].couponType
            couponValue = body.coupons[i].couponValue
            await QRCodeTemplates.create({
                QRCodeTemplateId: qrCodeTemplateId,
                bizType: "eshop",
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                tableName: "0号桌",
                couponType: couponType,
                couponValue: couponValue,
                couponRate: body.couponRate,
                descriptor: body.descriptor==null?null:body.descriptor,
            });
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCodeTemplateId);
    },
    async updateQRCodeTemplate (ctx, next) {
        ctx.checkBody('/condition/QRCodeTemplateId', true).first().notEmpty();
        ctx.checkBody('/condition/id', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/bizType', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/tableName', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/couponType', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/couponValue', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/couponRate', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/tenantId', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/descriptor', true).first().notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body;
        let qrCodeTemplate = await QRCodeTemplates.findOne({
            where: {
                QRCodeTemplateId: body.condition.QRCodeTemplateId,
                id: body.condition.id
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
            qrCodeTemplate.descriptor = body.QRCodeTemplate.descriptor;
            await qrCodeTemplate.save();
        } else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '二维码模板不存在！');
            return;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getQRCodeTemplate (ctx, next) {
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let whereJson={}
        if((ctx.query.tenantId!=null && ctx.query.tenantId!="") && (ctx.query.consigneeId==null||ctx.query.consigneeId=="")){
            whereJson={
                tenantId : ctx.query.tenantId
            }
        }else if((ctx.query.tenantId==null || ctx.query.tenantId=="") && (ctx.query.consigneeId!=null && ctx.query.consigneeId!="")){
            whereJson={
                consigneeId : ctx.query.consigneeId
            }
        }else if((ctx.query.tenantId!=null && ctx.query.tenantId!="") && (ctx.query.consigneeId!=null && ctx.query.consigneeId!="")){
            whereJson={
                tenantId : ctx.query.tenantId,
                consigneeId : ctx.query.consigneeId
            }
        }
        let qrCodeTemplates = await QRCodeTemplates.findAll({
            where: whereJson
        });
        if(qrCodeTemplates.length==0){

        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCodeTemplates);
    },
    async deleteQRCodeTemplate(ctx, next){
        ctx.checkQuery('QRCodeTemplateId').notEmpty();
        ctx.checkQuery('id').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let qrCodeTemplate = await QRCodeTemplates.findOne({
            where: {
                QRCodeTemplateId: ctx.query.QRCodeTemplateId,
                id: ctx.query.id,
            }
        });
        if (qrCodeTemplate == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '二维码模板不存在！无需删除！');
            return;
        }
        await qrCodeTemplate.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    async saveQRCodeTemplate (ctx, next) {
        ctx.checkBody('bizType').notEmpty();
        ctx.checkBody('coupons').notEmpty()
        ctx.checkBody('couponRate').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('descriptor').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body;
        let qrCodeTemplateId = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);
        let couponType;
        let couponValue;
        if (body.coupons.length == 0) {
            await QRCodeTemplates.create({
                QRCodeTemplateId: qrCodeTemplateId,
                bizType: body.bizType,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                tableName: "0号桌",
                couponRate: body.couponRate,
                descriptor: body.descriptor,
            });
        }
        for (let i = 0; i < body.coupons.length; i++) {
            couponType = body.coupons[i].couponType
            couponValue = body.coupons[i].couponValue
            await QRCodeTemplates.create({
                QRCodeTemplateId: qrCodeTemplateId,
                bizType: body.bizType,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                tableName: "0号桌",
                couponType: couponType,
                couponValue: couponValue,
                couponRate: body.couponRate,
                descriptor: body.descriptor,
            });
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCodeTemplateId);
    },
    
}


