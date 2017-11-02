const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Units = db.models.Units;

module.exports = {
    //新增商品类型
    async saveAdminMenus (ctx, next) {
        ctx.checkBody('/unit/goodUnit', true).first().notBlank();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let body = ctx.request.body;
        // if(body.menu.name==""){
        //     ctx.body = new ApiResult(ApiResult.Result.EXISTED, "菜品类别不能为空")
        //     return;
        // }
        let unit = await Units.findOne({
            where: {
                goodUnit: body.unit.goodUnit
            }
        });
        if (unit!=null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "此单位已存在已存在，请重新定义")
            return;
        }

        await Units.create({
            goodUnit : body.unit.goodUnit

            // todo: ok?
            //deletedAt: Date.now()
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    //修改商品类型
    async updateAdminMenusById (ctx, next) {
        ctx.checkBody('/condition/id', true).first().notEmpty();
        ctx.checkBody('/unit/goodUnit', true).first().notBlank();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        // if(body.menu.name==""){
        //     ctx.body = new ApiResult(ApiResult.Result.EXISTED, "菜品不存在，请重新定义")
        //     return;
        // }
        let unit = await Units.findOne({
            where: {
                id: body.condition.id
            }
        });
        if (unit == null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "菜品单位不存在，请重新定义")
            return;
        }
        unit.goodUnit = body.unit.goodUnit;
        //menus.type = body.type;
        await unit.save();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //
    async getAdminMenus (ctx, next) {
        // ctx.checkQuery('tenantId').notEmpty();
        // if (ctx.errors) {
        //     ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
        //     return;
        // }
        let units = await Units.findAll({
            where: {
                tenantId: ctx.query.tenantId
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            }
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, units);
    },


}