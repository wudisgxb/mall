let db = require('../../db/mysql/index');
const ApiResult = require('../../db/mongo/ApiResult')
let Vips = db.models.Vips;
module.exports = {

  async checkUserVip (ctx, next) {
    ctx.checkQuery('phone').notEmpty().isInt();

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }
    let vips = await Vips.findAll({
      where:{
        phone:ctx.query.body.phone,
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