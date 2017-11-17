const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const QRCodeTemplates = db.models.QRCodeTemplates;
const AllianceMerchants = db.models.AllianceMerchants;
const Alliances = db.models.Alliances
const AllianceHeadquarters = db.models.AllianceHeadquarters
const Merchants = db.models.Merchants;
const Consignees = db.models.Consignees;
const Tables = db.models.Tables;
const Tool = require('../../Tool/tool');

module.exports = {

    async saveAllQRCodeTemplateBytable(ctx,next){
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('consigneeId').notEmpty()
        let body = ctx.request.body
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let table = await Tables.findAll({
            where:{
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
            }
        })
        for(let i  = 0; i < table.length; i++){
            let name = table[i].name
            let qrcodeId = "201711171042"+"00000"+name
            console.log(qrcodeId)
            await QRCodeTemplates.create({
                QRCodeTemplateId : qrcodeId,
                bizType : "eshop",
                tableName : name,
                couponType : null,
                couponValue : null,
                couponRate : null,
                tenantId : table[i].tenantId,
                consigneeId : table[i].consigneeId,
                descriptor : "",
                orderLimit : -1,
                isShared : 0,
            })
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

    },
    async saveAllQRCodeTemplate (ctx, next) {
        // ctx.checkBody('bizType').notEmpty();
        ctx.checkBody('coupons').notEmpty()
        ctx.checkBody('couponRate').notEmpty();
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
        for(let qr of qrCodeTemplates){
            if(body.tenantId==qr.tenantId){
                ctx.body = new ApiResult(ApiResult.Result.SUCCESS, "此代售点下已有此租户");
                return
            }
        }

        let couponType;
        let couponValue;
        if (body.coupons.length == 0) {
            await QRCodeTemplates.create({
                QRCodeTemplateId: qrCodeTemplateId,
                bizType: "eshop",
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                couponRate: body.couponRate,
                tableName: "0号桌",
                descriptor: body.descriptor==null?null:body.descriptor,
            });
        }
        if(body.coupons.length > 0){
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
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCodeTemplateId);
    },
    async updateQRCodeTemplate (ctx, next) {
        ctx.checkBody('/condition/QRCodeTemplateId', true).first().notEmpty();
        ctx.checkBody('/condition/id', true).first().notEmpty();
        // ctx.checkBody('/QRCodeTemplate/bizType', true).first().notEmpty();
        // ctx.checkBody('/QRCodeTemplate/tableName', true).first().notEmpty();
        // ctx.checkBody('/QRCodeTemplate/couponType', true).first().notEmpty();
        // ctx.checkBody('/QRCodeTemplate/couponValue', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/coupons', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/couponRate', true).first().notEmpty();
        ctx.checkBody('/QRCodeTemplate/tenantId', true).first().notEmpty();
        // ctx.checkBody('/QRCodeTemplate/descriptor', true).first().notEmpty();

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
        console.log(body.condition.QRCodeTemplateId)
        console.log(body.condition.id)
        if (qrCodeTemplate == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '二维码模板不存在！');
            return;
        }
        let couponType;
        let couponValue;
        if(body.QRCodeTemplate.coupons.length==0){
            qrCodeTemplate.bizType = "eshop";
            qrCodeTemplate.tableName = "0号桌";
            qrCodeTemplate.couponRate = body.QRCodeTemplate.couponRate;
            qrCodeTemplate.tenantId = body.QRCodeTemplate.tenantId;
            qrCodeTemplate.consigneeId = body.QRCodeTemplate.consigneeId;
            qrCodeTemplate.descriptor = body.QRCodeTemplate.descriptor==null?null:body.QRCodeTemplate.descriptor;
            await qrCodeTemplate.save();
        }else{
            for (let i = 0; i < body.QRCodeTemplate.coupons.length; i++) {
                couponType = body.QRCodeTemplate.coupons[i].couponType
                couponValue = body.QRCodeTemplate.coupons[i].couponValue

                await QRCodeTemplates.create({
                    QRCodeTemplateId: body.condition.QRCodeTemplateId,
                    bizType: "eshop",
                    tenantId: body.QRCodeTemplate.tenantId,
                    consigneeId: body.QRCodeTemplate.consigneeId,
                    tableName: "0号桌",
                    couponType: couponType,
                    couponValue: couponValue,
                    couponRate: body.QRCodeTemplate.couponRate,
                    descriptor: body.QRCodeTemplate.descriptor==null?null:body.QRCodeTemplate.descriptor,
                });
            }
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

        let pageNumber = parseInt(ctx.query.pageNumber);

        if(pageNumber<1){
            pageNumber=1
        }

        let pageSize = parseInt(ctx.query.pageSize);
        if(pageNumber<1){
            pageNumber=1
        }
        let place = (pageNumber - 1) * pageSize;
        let qrCodeTemplates
        if(ctx.query.pageNumber!=null&&ctx.query.pageSize!=null&&ctx.query.pageSize!=""&&ctx.query.pageNumber!=""){
            qrCodeTemplates = await QRCodeTemplates.findAll({
                where: whereJson,
                offset: Number(place),
                limit: Number(pageSize)
            });
        }
        if(ctx.query.pageNumber==null&&ctx.query.pageSize==null){
            qrCodeTemplates = await QRCodeTemplates.findAll({
                where: whereJson,

            });
        }

        if(qrCodeTemplates.length==0){
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, "查不到此数据");
            return;
        }
        let qrCodeTemplatesArray = []

        for(let i = 0; i < qrCodeTemplates.length; i++){
            let merchant = await Merchants.findOne({
                where:{
                    tenantId : qrCodeTemplates[i].tenantId
                }
            })
            let consignee = await Consignees.findOne({
                where:{
                    consigneeId : qrCodeTemplates[i].consigneeId
                }
            })
            let qrCodeTemplatesJson = {
                id : qrCodeTemplates[i].id,
                QRCodeTemplateId : qrCodeTemplates[i].QRCodeTemplateId,
                bizType : qrCodeTemplates[i].bizType,
                couponType : qrCodeTemplates[i].couponType,
                couponValue : qrCodeTemplates[i].couponValue,
                couponRate : qrCodeTemplates[i].couponRate,
                tenantId : qrCodeTemplates[i].tenantId,
                consigneeId : qrCodeTemplates[i].consigneeId,
                descriptor : qrCodeTemplates[i].descriptor,
                orderLimit : qrCodeTemplates[i].orderLimit,
                tableName : qrCodeTemplates[i].tableName,
                isShared : qrCodeTemplates[i].isShared,
                tenantName : merchant==null?null:merchant.name,
                consigneeName : consignee==null?null:consignee.name
            }
            qrCodeTemplatesArray.push(qrCodeTemplatesJson)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCodeTemplatesArray);
    },
    async getQRCodeTemplateCount(ctx, next){
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
        let qrCodeTemplatesCount = await QRCodeTemplates.count({
            where: whereJson,

        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,qrCodeTemplatesCount)
    },
    async getQRCodeTemplateByTenantId(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let qrCodeTemplates = await QRCodeTemplates.findOne({
            where:{
                tenantId:ctx.query.tenantId,
                bizType : "Ipay"
            }
        })
        if(qrCodeTemplates==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"查询不到此二维码")
            return
        }
        // console.log(qrCodeTemplates)
        let qrCodeTemplatesArray =[]
        // for(let i = 0; i < qrCodeTemplates.length; i++){

            let merchant = await Merchants.findOne({
                where:{
                    tenantId : qrCodeTemplates.tenantId
                }
            })
            let paymentMerchant;
            if(merchant!=null){
                let allianceMerchants = await AllianceMerchants.findOne({
                    where:{
                        tenantId : qrCodeTemplates.tenantId
                    }
                })
                paymentMerchant = allianceMerchants
            }
            if(merchant==null){
                let alliances = await Alliances.findOne({
                    where:{
                        alliancesId : qrCodeTemplates.tenantId
                    }
                })
                merchant = alliances
                let allianceHeadquarters = await AllianceHeadquarters.findOne({
                    where:{
                        alliancesId : qrCodeTemplates.tenantId
                    }
                })
                paymentMerchant = allianceHeadquarters
            }
            let consignee = await Consignees.findOne({
                where:{
                    consigneeId : qrCodeTemplates.consigneeId
                }
            })
            let qrCodeTemplatesJson = {
                id : qrCodeTemplates.id,
                QRCodeTemplateId : qrCodeTemplates.QRCodeTemplateId,
                bizType : qrCodeTemplates.bizType,
                couponType : qrCodeTemplates.couponType,
                couponValue : qrCodeTemplates.couponValue,
                couponRate : qrCodeTemplates.couponRate,
                tenantId : qrCodeTemplates.tenantId,
                consigneeId : qrCodeTemplates.consigneeId,
                descriptor : qrCodeTemplates.descriptor,
                orderLimit : qrCodeTemplates.orderLimit,
                tableName : qrCodeTemplates.tableName,
                isShared : qrCodeTemplates.isShared,
                tenantName : merchant==null?null:merchant.name,
                consigneeName : consignee==null?null:consignee.name,
                paymentMerchant : paymentMerchant.name
            }
            qrCodeTemplatesArray.push(qrCodeTemplatesJson)
        // }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,qrCodeTemplatesArray)

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
    async saveBatchQRCodeTemplate (ctx, next) {
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


