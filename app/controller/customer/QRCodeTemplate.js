const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const QRCodeTemplates = db.models.QRCodeTemplates;
const PaymentReqs = db.models.PaymentReqs;
const Merchants = db.models.Merchants;
const Consignees = db.models.Consignees;
const DistanceAndPrices = db.models.DistanceAndPrices;
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

        if (qrCodeTemplates[0].bizType == 'openId') {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, qrCodeTemplates[0]);
            return;
        }

        //青豆家抢购活动，10次
        if (ctx.query.QRCodeTemplateId == '201708101938208000001') {
            let paymentReqs = await PaymentReqs.findAll({
                where: {
                    consigneeId: '48d473e77f459833bb06c60f9a8f0000',
                    $or: [{total_amount: '5'}, {total_amount: '15'}, {total_amount: '25'}, {total_amount: '35'}, {total_amount: '45'}, {total_amount: '55'}, {total_amount: '65'}, {total_amount: '75'}],
                    isFinish: true,
                    isInvalid: false
                }
            });

            if (paymentReqs.length >= 11) {
                ctx.body = new ApiResult(ApiResult.Result.EXISTED);
                return;
            }
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

            //获取主页图
            let tenantConfig = await TenantConfigs.findOne({
                where: {
                    tenantId: tenantIdArray[i],
                }
            });
            tenantConfig = JSON.parse(JSON.stringify(tenantConfig));
            delete tenantConfig.payee_account;
            delete tenantConfig.wecharPayee_account;
            delete tenantConfig.id;
            delete tenantConfig.name;
            delete tenantConfig.createdAt;
            delete tenantConfig.updatedAt;
            delete tenantConfig.isRealTime;
            delete tenantConfig.needVip;
            delete tenantConfig.vipFee;
            delete tenantConfig.vipRemindFee;
            delete tenantConfig.invaildTime;
            delete tenantConfig.firstDiscount;
            //根据租户id查找配送费，没有就不填
            let distanceAndPrices = await DistanceAndPrices.findAll({
                where: {
                    tenantId: tenantIdArray[i]
                }
            });

            let consignee;
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
                    qrCode.tenantInfo = tenantConfig;
                    qrCode.consigneeId = qrCodeTemplates[j].consigneeId;
                    //查找代售商户信息
                    if (qrCodeTemplates[j].consigneeId != null && qrCodeTemplates[j].consigneeId != '') {
                        consignee = await Consignees.findOne({
                            where: {
                                consigneeId: qrCodeTemplates[j].consigneeId
                            }
                        });
                        qrCode.consigneeName = consignee.name;
                    }
                    if (qrCodeTemplates[j].couponType != null && qrCodeTemplates[j].couponValue != null) {
                        coupons.push({
                            "couponType": qrCodeTemplates[j].couponType,
                            "couponValue": qrCodeTemplates[j].couponValue
                        })
                    }
                    //配送费
                    if (distanceAndPrices.length > 0) {
                        qrCode.startPrice = distanceAndPrices[0].startPrice;
                        qrCode.deliveryFee = distanceAndPrices[0].deliveryFee;
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