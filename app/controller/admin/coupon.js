const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const Coupons = db.models.Coupons;
const coupon = require('../../controller/customer/coupon');

module.exports = {

    async saveAdminCoupon (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('couponType').notEmpty()
        ctx.checkBody('value').notEmpty();
        ctx.checkBody('time').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;

        let couponKey = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);

        await Coupons.create({
            couponKey: couponKey,
            phone: body.phone,
            tenantId: body.tenantId,
            consigneeId: body.consigneeId,
            time: body.time,
            couponType: body.couponType,
            value: body.value,
            status: 0
        });

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    async updateAdminCoupon (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('couponKey').notEmpty();
        ctx.checkBody('couponType').notEmpty()
        ctx.checkBody('value').notEmpty();
        ctx.checkBody('time').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;

        let coupon = await Coupons.findOne({
            where: {
                couponKey: body.couponKey,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
            }
        })
        if (coupon != null) {
            coupon.couponType = body.couponType;
            coupon.value = body.value;
            coupon.time = body.time;
            await coupon.save();
        } else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '优惠券不存在！');
            return;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getAdminCoupon (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let coupons = await Coupons.findAll({
            where: {
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                status: 0
            }
        });

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, coupons);
    },
    async deleteAdminCoupon(ctx, next){
        ctx.checkQuery('couponKey').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let coupon = await Coupons.findOne({
            where: {
                couponKey: ctx.query.couponKey,
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
            }
        });
        if (coupon == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '优惠券不存在！无需删除！');
            return;
        }
        await coupon.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }

}