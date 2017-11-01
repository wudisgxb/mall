const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let GoodsPromotions = db.models.GoodsPromotions;

module.exports = {

    async saveAdminGoodsPromotion (ctx, next) {
        ctx.checkBody('QRCodeTemplateId').notEmpty();
        ctx.checkBody('goodsId').notEmpty();
        ctx.checkBody('goodsName').notEmpty();
        ctx.checkBody('target').notEmpty();
        ctx.checkBody('originalPrice').notEmpty();
        ctx.checkBody('discount').notEmpty();
        ctx.checkBody('activityPrice').notEmpty();
        ctx.checkBody('couponRate').notEmpty();
        ctx.checkBody('purchaseLimit').notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body;
        let goodsPromotions = await GoodsPromotions.findAll({
            where: {
                QRCodeTemplateId: body.QRCodeTemplateId,
                tenantId: body.tenantId,
                goodsId: body.goodsId,
            }
        })
        if (goodsPromotions.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "商品优惠已存在！");
            return;
        }

        await GoodsPromotions.create({
            QRCodeTemplateId: body.QRCodeTemplateId,
            goodsId: body.goodsId,
            goodsName: body.goodsName,
            target: body.target,
            originalPrice: body.originalPrice,
            discount: body.discount,
            activityPrice: body.activityPrice,
            couponRate: body.couponRate,
            purchaseLimit: body.purchaseLimit,
            tenantId: body.tenantId,
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async updateAdminGoodsPromotion (ctx, next) {
        ctx.checkBody('/goodsPromotionSetting/QRCodeTemplateId', true).first().notEmpty();
        ctx.checkBody('/goodsPromotionSetting/goodsId', true).first().notEmpty();
        ctx.checkBody('/goodsPromotionSetting/goodsName', true).first().notEmpty();
        ctx.checkBody('/goodsPromotionSetting/target', true).first().notEmpty();
        ctx.checkBody('/goodsPromotionSetting/originalPrice', true).first().notEmpty();
        ctx.checkBody('/goodsPromotionSetting/discount', true).first().notEmpty();
        ctx.checkBody('/goodsPromotionSetting/activityPrice', true).first().notEmpty();
        ctx.checkBody('/goodsPromotionSetting/couponRate', true).first().notEmpty();
        ctx.checkBody('/goodsPromotionSetting/purchaseLimit', true).first().notEmpty();

        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        ctx.checkBody('/condition/id', true).first().notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body;

        let goodsPromotion = await GoodsPromotions.findOne({
            where: {
                id: body.condition.id,
                tenantId: body.condition.tenantId
            }
        });
        if (goodsPromotion != null) {
            goodsPromotion.QRCodeTemplateId = body.goodsPromotionSetting.QRCodeTemplateId;
            goodsPromotion.goodsId = body.goodsPromotionSetting.goodsId;
            goodsPromotion.goodsName = body.goodsPromotionSetting.goodsName;
            goodsPromotion.target = body.goodsPromotionSetting.target;
            goodsPromotion.originalPrice = body.goodsPromotionSetting.originalPrice;
            goodsPromotion.discount = body.goodsPromotionSetting.discount;
            goodsPromotion.activityPrice = body.goodsPromotionSetting.activityPrice;
            goodsPromotion.couponRate = body.goodsPromotionSetting.couponRate;
            goodsPromotion.purchaseLimit = body.goodsPromotionSetting.purchaseLimit;
            await goodsPromotion.save();
        } else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到记录！');
            return;
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getAdminGoodsPromotion (ctx, next) {

        let keys = ['id', 'QRCodeTemplateId', 'goodsId', 'goodsName', 'target', 'originalPrice', 'discount', 'activityPrice', 'couponRate', 'purchaseLimit', 'tenantId'];

        const condition = await keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})
        let pageNumber = parseInt(ctx.query.pageNumber);

        if(pageNumber<1){
            pageNumber=1
        }

        let pageSize = parseInt(ctx.query.pageSize);
        if(pageNumber<1){
            pageNumber=1
        }
        let place = (pageNumber - 1) * pageSize;
        let goodsPromotions
        if(ctx.query.pageSize!=null&&ctx.query.pageSize!=""&&ctx.query.pageNumber!=null&&ctx.query.pageNumber!=""){
            goodsPromotions = await GoodsPromotions.findAll({
                where: condition,
                offset: Number(place),
                limit: Number(pageSize)
            });
        }else{
            goodsPromotions = await GoodsPromotions.findAll({
                where: condition
            });
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, goodsPromotions);
    },

    async getAdminGoodsPromotionCount (ctx, next) {

        let keys = ['id', 'QRCodeTemplateId', 'goodsId', 'goodsName', 'target', 'originalPrice', 'discount', 'activityPrice', 'couponRate', 'purchaseLimit', 'tenantId'];

        const condition = await keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})

        let goodsPromotions
        goodsPromotions = await GoodsPromotions.count({
            where: condition
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, goodsPromotions);
    },

    async deleteAdminGoodsPromotion(ctx, next){
        ctx.checkQuery('id').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let id = ctx.query.id;
        let tenantId = ctx.query.tenantId;
        let keys = ['id', 'QRCodeTemplateId', 'goodsId', 'goodsName', 'target', 'originalPrice', 'discount', 'activityPrice', 'couponRate', 'purchaseLimit', 'tenantId'];
        const condition = await keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})
        let goodsPromotions = await GoodsPromotions.findAll({
            where: condition
        });

        if (goodsPromotions == null || goodsPromotions.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '商品优惠不存在！');
            return;
        }

        await goodsPromotions.reduce(async(accu, goodsPromotion) => {
            await goodsPromotion.destroy();
            return accu;
        }, {})

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }

}