const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Vips = db.models.Vips;

module.exports = {

    async saveAdminVip (ctx, next) {
        ctx.checkBody('phone').notEmpty();
        ctx.checkBody('vipLevel').notEmpty().isInt().ge(0).toInt();
        ctx.checkBody('vipName').notEmpty()
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }
        let isCreate = true;

        if (isCreate) {
            let vips = await Vips.findAll({
                where: {
                    phone: body.phone,
                    tenantId: ctx.query.tenantId
                }
            })
            if (vips.length > 0) {
                ctx.body = {
                    resCode: -1,
                    result: "会员已存在！"
                }
                return;
            }
            await Vips.create({
                phone: body.phone,
                vipLevel: body.vipLevel,
                vipName: body.vipName,
                tenantId: ctx.query.tenantId
                // todo: ok?
                //deletedAt: Date.now()
            });
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
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
    async getAdminVip (ctx, next) {
        let vips = await Vips.findAll({
            where: {
                tenantId: ctx.query.tenantId
            }
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, vips);
    },
    async deleteAdminVip(ctx, next){
        ctx.checkParams('id').notEmpty().isInt().toInt();
        let table = await Tables.findById(ctx.params.id);
        await table.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }

}