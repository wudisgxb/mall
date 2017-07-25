const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let Captcha = db.models.Captcha
let Admins = db.models.Adminer

module.exports = {
    async saveregister (ctx, next) {
        ctx.checkBody('userName').notEmpty()
        ctx.checkBody('password').notEmpty()
        ctx.checkBody('phone').notEmpty()
        if(ctx.errors){
            ctx.body= new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors)
        }
        let body = ctx.request.body;
        let adminbynickname = await Admins.findOne({
            where:{
                nickname:body.userName
            }
        })
        if(adminbynickname!=null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"已存在此用户名");
            return;
        }
        let tenantId =  Tool.allocTenantId
        await Admins.create({
            nickname:body.userName,
            name : body.name==null?"空字符串":body.name,
            password:body.password,
            phone:body.phone,
            status:body.status==null?"空字符串":body.status,
            type:body.type==null?"空字符串":body.type,
            tenantType:body.tenantType==null?"空字符串":body.tenantType,
            tenantId:tenantId
        })


    }
}


