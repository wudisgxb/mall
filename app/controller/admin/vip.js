const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Vip = db.models.Vips;

module.exports = {

    async saveAdminVip (ctx, next) {
        ctx.checkBody('/vip/phone',true).first().notEmpty();
        ctx.checkBody('/vip/vipLevel',true).first().notEmpty();
        ctx.checkBody('/vip/name',true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty()
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body=new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let vips = await Vip.findAll({
            where: {
                phone: body.vip.phone,
                tenantId:body.tenantId
            }
        })
        if (vips.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"会员已存在")
            return;
        }
        await Vip.create({
            phone: body.vip.phone,
            vipLevel: body.vip.vipLevel,
            vipName: body.vip.name,
            tenantId: body.tenantId
            // todo: ok?
            //deletedAt: Date.now()
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async updateAdminVipById (ctx, next) {

        ctx.checkBody('/condition/id',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();
        ctx.checkBody('/vip/name',true).first().notEmpty();
        ctx.checkBody('/vip/phone',true).first().notEmpty();
        ctx.checkBody('/vip/vipLevel',true).first().notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors);
            return;
        }
        let vips = await Vip.findOne({
            where: {
                id: body.condition.id,
                tenantId:body.condition.tenantId
            }
        })
        if (vips != null) {
            vips.phone = body.vip.phone;
            vips.vipLevel = body.vip.vipLevel;
            vips.vipName = body.vip.name;
            vips.tenantId=body.condition.tenantId;
            await vips.save();

        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

    },

    async getAdminVip (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();

        if(ctx.errors){
            new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors);
            return;
        }

        let vips = await Vip.findAll({
            where: {
                tenantId: ctx.query.tenantId
            }
        });
        if(vips.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此vip");
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, vips);
    },
    
    async deleteAdminVip(ctx, next){

        ctx.checkQuery('id').notEmpty().isInt().toInt();
        ctx.checkQuery('tenantId').notEmpty();

        let table = await Vip.findOne({
            where:{
                id:ctx.query.id,
                tenantId:ctx.query.tenantId
            }
        });
        if(table==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此vip记录");
        }
        await table.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }

}