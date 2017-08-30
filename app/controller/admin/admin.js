const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let Captcha = db.models.Captcha
let Admins = db.models.Adminer
let Merchants = db.models.Merchants

module.exports = {
    async register (ctx, next) {
        ctx.checkBody('userName').notEmpty()
        ctx.checkBody('password').notEmpty()
        ctx.checkBody('phone').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let admin = await Admins.findOne({
            where: {
                nickname: body.userName
            }
        })
        if (admin != null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "用户名已存在！");
            return;
        }
        let tenantId = Tool.allocTenantId();

        await Admins.create({
            nickname: body.userName,
            name: body.name == null ? "超级管理员" : body.name,
            password: body.password,
            phone: body.phone,
            status: body.status == null ? 0 : body.status,
            type: body.type == null ? 100 : body.type,
            tenantType: body.tenantType == null ? "租户" : body.tenantType,
            tenantId: tenantId
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);

    },

    async getAdminAllTenantId(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return
        }
        //查询tenantId不为All的所有数据
        let admins = await Admins.findAll({
            where: {
                tenantId: {
                    $ne: ctx.query.tenantId
                }
            }
        })
        //根据查询到的tenantId查询租户的名字
        let merchantAll = []
        for (let i = 0; i < admins.length; i++) {

            let merchant = await Merchants.findOne({
                where: {
                    tenantId: admins[i].tenantId
                }
            })
            if (merchant != null) {
                merchantAll.push(merchant)
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, merchantAll);
    }
}


