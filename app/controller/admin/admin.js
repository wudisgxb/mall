const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Admins = db.models.Adminer
let Tool = require('../../Tool/tool')
let Captcha = db.models.Captcha

module.exports = {
    // async putAdminAdminers(ctx,next){
    //     ctx.checkBody('admin/userName',true).first().notEmpty();
    //     // ctx.checkBody('admin/name',true).first().notEmpty();
    //     ctx.checkBody('admin/password',true).first().notEmpty();
    //     ctx.checkBody('admin/phone',true).first().notEmpty();
    //     ctx.checkBody('admin/type',true).first().notEmpty();
    //     ctx.checkBody('condition/tenantId',true).first().notEmpty();
    //     ctx.checkBody('condition/tenantType',true).first().notEmpty();
    //     ctx.checkBody('condition/id',true).first().notEmpty();
    //     let body = ctx.request.body;
    //     if (this.errors) {
    //         ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,this.errors);
    //         return;
    //     }
    //     let adminers = await Admins.findOne({
    //         where : {
    //             tenantId:body.condition.tenantId,
    //             tenantType:body.condition.tenantType,
    //             id:body.condition.id
    //         }
    //     })
    //     if(adminers==null){
    //         ctx.body=new ApiResult(ApiResult.Result.DB_ERROR,"没有此商户和代售点");
    //         return;
    //     }
    //     adminers.nickname=body.admin.userName;
    //     // adminers.name=body.admin.name;
    //     adminers.password=body.admin.password;
    //     adminers.phone=body.admin.phone;
    //     await adminers.save();
    //     ctx.body=new ApiResult(ApiResult.Result.SUCCESS);
    // }
}


