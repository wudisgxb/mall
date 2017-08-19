const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const Coupons = db.models.Coupons;
const CouponLimits = db.models.CouponLimits;
const Merchants = db.models.Merchants;
const Tool = require('../../Tool/tool');

module.exports = {

    async bindCoupon (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        //ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('coupons').notEmpty();
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('couponRate').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;

        let couponLimit = await CouponLimits.findOne({
            where: {
                tenantId: body.tenantId
            }
        });

        //let couponKey = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);

        let coupon = await Coupons.findAll({
            where: {
                phone: body.phoneNumber,
                tenantId: body.tenantId,
                createdAt: {
                    $gte: new Date(new Date() - couponLimit.invalidTime)
                },
                status: 0
                // createdAt: {
                //     $lt: new Date(new Date().format("yyyyMMdd")) + 86400000,
                //     $gte: new Date(new Date().format("yyyyMMdd"))
                // },
            }
        });

        if (coupon.length >= couponLimit.numLimit) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, '优惠券领用次数超限');
        } else {
            body.coupons.forEach(async function (e) {
                var couponKey = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);
                await Coupons.create({
                    couponKey: couponKey,
                    phone: body.phoneNumber,
                    tenantId: body.tenantId,
                    consigneeId: body.consigneeId,
                    couponType: e.couponType,
                    value: e.couponValue,
                    couponRate: body.couponRate,
                    status: 0
                });
            })

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
        }
    },
    //查看优惠券是否能领取
    async isCouponReceivable (ctx, next) {
        ctx.checkQuery('phoneNumber').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        //ctx.checkBody('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let couponLimit = await CouponLimits.findOne({
            where: {
                tenantId: ctx.query.tenantId
            }
        });

        let coupon = await Coupons.findAll({
            where: {
                phone: ctx.query.phoneNumber,
                tenantId: ctx.query.tenantId,
                //consigneeId: body.consigneeId,
                createdAt: {
                    $gte: new Date(new Date() - couponLimit.invalidTime)
                },
                status: 0
                // createdAt: {
                //     $lt: new Date(new Date().format("yyyyMMdd")) + 86400000,
                //     $gte: new Date(new Date().format("yyyyMMdd"))
                // },
            }
        });

        if (coupon.length >= couponLimit.numLimit) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, '优惠券领用次数超限');
            return;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    //获取可用优惠券
    async getAvailableCoupon (ctx, next) {
        //ctx.checkQuery('tenantId').notEmpty();
        //ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        if (ctx.query.tenantId != null) {
            //获取租户名称
            let merchant = await Merchants.findOne({
                where: {
                    tenantId: ctx.query.tenantId ,
                }
            })

            //通过租户id获取第一个,一个租户只能1个限制
            let couponLimit = await CouponLimits.findOne({
                where: {
                    tenantId: ctx.query.tenantId,
                }
            });

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
                if ((Date.now() - coupons[i].createdAt.getTime()) > couponLimit.invalidTime) {
                    coupons.splice(i, 1);
                    i = i - 1;
                }
            }

            let retCoupons = [];
            let copyCoupon = {};

            coupons.forEach(function (e) {
                var coupon = new Object();
                coupon.tenantId = ctx.query.tenantId;
                coupon.merchantName = merchant.name;
                coupon.couponKey = e.couponKey;
                coupon.couponRate = e.couponRate;
                coupon.couponType = e.couponType;
                coupon.value = e.value;
                coupon.createdAt = e.createdAt;
                coupon.InvalidDate = new Date(e.createdAt.getTime() + couponLimit.invalidTime);

                retCoupons.push(coupon);
            })
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, retCoupons);
            return;
        } else {
            let tenantIdArray = [];
            //通过手机号查询可用优惠券
            let coupons = await Coupons.findAll({
                where: {
                    phone: ctx.query.phoneNumber,
                    status: 0
                },
                attributes: {
                    exclude: ['updatedAt', 'id', 'deletedAt']
                }
            });
            coupons.forEach(function (e) {
                if (!tenantIdArray.contains(e.tenantId)) {
                    tenantIdArray.push(e.tenantId);
                }
            })

            let retCoupons = [];
            for (var i = 0;i<tenantIdArray.length;i++) {

                //获取租户名称
                let merchant = await Merchants.findOne({
                    where: {
                        tenantId: tenantIdArray[i],
                    }
                })
                //通过租户id获取第一个,一个租户只能1个限制
                let couponLimit = await CouponLimits.findOne({
                    where: {
                        tenantId: tenantIdArray[i],
                    }
                });

                //通过手机号查询可用优惠券
                let coupons = await Coupons.findAll({
                    where: {
                        phone: ctx.query.phoneNumber,
                        tenantId: tenantIdArray[i],
                        status: 0
                    },
                    attributes: {
                        exclude: ['updatedAt', 'id', 'deletedAt']
                    }
                });

                for (var i = 0; i < coupons.length; i++) {
                    if ((Date.now() - coupons[i].createdAt.getTime()) > couponLimit.invalidTime) {
                        coupons.splice(i, 1);
                        i = i - 1;
                    }
                }

                let copyCoupon = {};

                coupons.forEach(function (e) {
                    var coupon = new Object();
                    coupon.tenantId = tenantIdArray[i];
                    coupon.merchantName = merchant.name;
                    coupon.couponKey = e.couponKey;
                    coupon.couponRate = e.couponRate;
                    coupon.couponType = e.couponType;
                    coupon.value = e.value;
                    coupon.createdAt = e.createdAt;
                    coupon.InvalidDate = new Date(e.createdAt.getTime() + couponLimit.invalidTime);

                    retCoupons.push(coupon);
                })
            }
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, retCoupons);
            return;
        }


    },

    //优惠券绑定订单号
    async couponBindTradeNo (ctx, next) {
        ctx.checkBody('couponKey').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        //ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('tradeNo').notEmpty();


        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;

        console.log("111body.tradeNo == " + body.tradeNo);
        console.log("222body.couponKey == " + body.couponKey);

        if (body.couponKey != '') {

            //根据订单号查找绑定优惠券
            let coupon = await Coupons.findOne({
                where: {
                    trade_no : body.tradeNo,
                    tenantId: body.tenantId,
                    //consigneeId: body.consigneeId,
                    phone: body.phoneNumber,
                    status: 0,
                }
            })

            if (coupon != null) {
                coupon.trade_no = null;
                await coupon.save();
            }

            coupon = await Coupons.findOne({
                where: {
                    couponKey: body.couponKey,
                    tenantId: body.tenantId,
                    //consigneeId: body.consigneeId,
                    phone: body.phoneNumber,
                    status: 0,
                }
            })

            if (coupon != null) {
                console.log("KKKKKKKKKKKKKKKKK");
                coupon.trade_no = body.tradeNo;
                await coupon.save();
            } else {
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,'优惠券不存在！');
                return;
            }
        } else {
            let coupon = await Coupons.findOne({
                where: {
                    trade_no: body.tradeNo,
                    tenantId: body.tenantId,
                    //consigneeId: body.consigneeId,
                    phone: body.phoneNumber,
                    status: 0,
                }
            })

            if (coupon != null) {
                coupon.trade_no = null;
                await coupon.save();
            }
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

}