const db = require('../../db/mysql/index');
const ApiResult = require('../../db/mongo/ApiResult')
const Vips = db.models.Vips;
const TenantConfigs = db.models.TenantConfigs;

module.exports = {

    async checkUserVip (ctx, next) {
        ctx.checkQuery('phone').notEmpty().isInt();

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        let vips = await Vips.findAll({
            where: {
                phone: ctx.request.body.phone,
                tenantId: ctx.query.tenantId
            }
        })
        if (vips.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result, true)
        } else {
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result, false)
        }
    },

    async isVip (phone, tenantId, totalPrice) {

        let isVip = false;

        if (phone == null) {
            return isVip;
        }

        let tenantConfig = await TenantConfigs.findOne({
            where: {
                tenantId: tenantId
            }
        });

        if (tenantConfig.needVip == false) {
            return isVip;
        }

        let vip = await Vips.findOne({
            where: {
                phone: phone,
                tenantId: tenantId
            }
        })
        if (vip == null) {
            if (totalPrice >= tenantConfig.vipFee) {
                await Vips.create({
                    phone: phone,
                    vipLevel: 0,
                    vipName: "test",
                    tenantId: tenantId
                    // todo: ok?
                });
                isVip = true;
            }
        } else {
            isVip = true;
        }
        return isVip;
    },

    async isVipWithoutPrice(phone, tenantId) {

        let isVip = false;

        if (phone == null) {
            return isVip;
        }

        let tenantConfig = await TenantConfigs.findOne({
            where: {
                tenantId: tenantId
            }
        });

        if (tenantConfig.needVip == false) {
            return isVip;
        }

        let vip = await Vips.findOne({
            where: {
                phone: phone,
                tenantId: tenantId
            }
        })
        if (vip == null) {
            isVip = false;
        } else {
            isVip = true;
        }
        return isVip;
    },


}