let db = require('../../db/mysql/index');

let Vips = db.models.Vips;
module.exports = {

  async saveUserVip (ctx, next) {
    ctx.checkBody('phone').notEmpty().isInt();

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }
    let vips = await Vips.findAll({
      where:{
        phone:ctx.request.body.phone,
        tenantId:ctx.query.tenantId
      }
    })
    if(vips.length > 0) {
      ctx.body =new ApiResult(ApiResult.Result.SUCCESS,result,true)
    }else {
      ctx.body =new ApiResult(ApiResult.Result.SUCCESS,result,false)
    }
  },




}