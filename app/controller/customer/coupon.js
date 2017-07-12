const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const Coupons = db.models.Coupons;
const CouponLimits = db.models.CouponLimits;

module.exports = {

    async bindCoupon (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('couponType').notEmpty();
        ctx.checkBody('couponValue').notEmpty();
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('couponFrom').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;

        let couponLimits = await CouponLimits.findOne({});

        let couponKey = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);

        let coupon = await Coupons.findAll({
            where: {
                phone: body.phoneNumber,
                createdAt: {
                    $gte: new Date(new Date() - couponLimits.invalidTime)
                },
                // createdAt: {
                //     $lt: new Date(new Date().format("yyyyMMdd")) + 86400000,
                //     $gte: new Date(new Date().format("yyyyMMdd"))
                // },
            }
        });


        if (coupon.length >= couponLimits.numLimit) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, '优惠券领用次数超限');
        } else {
            await Coupons.create({
                couponKey: couponKey,
                phone: body.phoneNumber,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                couponType: body.couponType,
                value: body.couponValue,
                status: 0
            });
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
        }
    },
    //查看优惠券是否能领取
    async isCouponReceivable (ctx, next) {
        ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let couponLimits = await CouponLimits.findOne({});

        let coupon = await Coupons.findAll({
            where: {
                phone: ctx.query.phoneNumber,
                createdAt: {
                    $gte: new Date(new Date() - couponLimits.invalidTime)
                },
                // createdAt: {
                //     $lt: new Date(new Date().format("yyyyMMdd")) + 86400000,
                //     $gte: new Date(new Date().format("yyyyMMdd"))
                // },
            }
        });

        if (coupon.length >= couponLimits.numLimit) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, '优惠券领用次数超限');
            return;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    //获取可用优惠券
    async getAvailableCoupon (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        //ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let couponLimits = await CouponLimits.findOne({});

        //通过手机号查询可用优惠券
        let coupons = await Coupons.findAll({
            where: {
                phone: ctx.query.phoneNumber,
                tenantId: ctx.query.tenantId,
                //consigneeId: ctx.query.consigneeId,
                status: 0
            },
            attributes: {
                exclude: ['updatedAt', 'id', 'deletedAt']
            }
        });


        for (var i = 0; i < coupons.length; i++) {
            if ((Date.now() - coupons[i].createdAt.getTime()) > couponLimits.invalidTime) {
                coupons.splice(i,1);
            }
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, coupons);
    },
}