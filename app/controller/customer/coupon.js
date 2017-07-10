const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const Coupons = db.models.Coupons;

module.exports = {

    async useCoupon (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('couponKey').notEmpty();
        ctx.checkBody('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;

        let coupon = await Coupons.findOne({
            where:{
                couponKey: body.couponKey,
                phone: null,
                trade_no:null,
                consigneeId: body.consigneeId,
                status: 0
            }
        });

        if (coupon == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,'优惠券未找到');
        } else {
            coupon.phone = body.phoneNumber;
            await coupon.save();
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
        }
    },
    async updateAdminVipById (ctx, next) {
        ctx.checkBody('phone').notEmpty();
        ctx.checkBody('vipLevel').notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('vipName').notEmpty()
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        let isCreate = true;
        let vip;
        if (ctx.params.id) {
            vip = await Vips.findById(ctx.params.id);
            if (vip != null) {
                vip.phone = body.phone;
                vip.vipLevel = body.vipLevel;
                vip.vipName = body.vipName
                await vip.save();
                isCreate = false;
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    //获取可用优惠券
    async getAvailableCoupon (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        //通过手机号查询可用优惠券
        let coupons = await Coupons.findAll({
            where: {
                phone: ctx.query.phoneNumber,
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                status:0
            },
            attributes: {
                exclude: ['updatedAt', 'id', 'deletedAt']
            }
        });


        for (var i = 0; i < coupons.length; i++) {
            if ((Date.now() - coupons[i].createdAt.getTime()) > coupons[i].time) {
                coupons.splice(i);
            }
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, coupons);
    },


    async getCoupon (tenantId, consigneeId,couponKey) {
        let coupon = await Coupons.findOne({
            where: {
                couponKey:couponKey,
                tenantId: tenantId,
                consigneeId: consigneeId,
                phone:null,
                status:0
            },
            attributes: {
                exclude: ['updatedAt', 'id', 'deletedAt']
            }
        });

        if (coupon != null) {
            if((Date.now() - coupon.createdAt.getTime()) > coupon.time) {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    },
}