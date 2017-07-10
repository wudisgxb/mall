const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Menus = db.models.Menus;

module.exports = {
    //新增商品类型
    async saveAdminMenus (ctx, next) {
        ctx.checkBody('/menu/name',true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let body = ctx.request.body;
        let menusResult = await Menus.findAll({
            where: {
                name : body.menu.name,
                tenantId: body.tenantId
            }
        });
        if (menusResult.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "菜品已存在，请重新定义")
            return;
        }

        let menus;
        menus = await Menus.create({
            name: body.menu.name,
            type: -1,
            tenantId: body.tenantId
            // todo: ok?
            //deletedAt: Date.now()
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    //修改商品类型
    async updateAdminMenusById (ctx, next) {
        ctx.checkBody('/condition/id',true).first().notEmpty();
        ctx.checkBody('/menu/name',true).first().notEmpty();
        ctx.checkBody('/condition/tenantId',true).first().notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let menusResult = await Menus.findAll({
            where: body.condition
        });
        if (menusResult.length <= 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "菜品不存在，请重新定义")
            return;
        }
        let id = menusResult[0].id
        let menus;
        menus = await Menus.findById(id);
        if (menus != null) {
            menus.name = body.menu.name;
            //menus.type = body.type;
            await menus.save();
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //
    async getAdminMenus (ctx, next) {
       
    },

}