const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Menus = db.models.Menus;


module.exports = {

  async saveAdminMenus (ctx, next) {
    ctx.checkBody('name').notEmpty();
    ctx.checkBody('type').notEmpty();

    let body = ctx.request.body;


    let menusResult = await Menus.findAll({
      where: {
        name: body.name,
        tenantId : ctx.query.tenantId
      }
    });

    if(menusResult.length >0) {
      ctx.body = {
        "errMsg" : "菜品已存在，请重新定义"
      }
      return;
    }

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }
    let isCreate = true;
    let menus;

    if (isCreate) {
      menus = await Menus.create({
        name: body.name,
        type: body.type,
        tenantId : ctx.query.tenantId
        // todo: ok?
        //deletedAt: Date.now()
      });

    }

    ctx.body =new ApiResult(ApiResult.Result.SUCCESS)
  },

  async updateAdminMenusById (ctx,next) {
    ctx.checkBody('name').notEmpty();
    ctx.checkBody('type').notEmpty();

    let body = ctx.request.body;
    let id = ctx.params.id

    let menusResult = await Menus.findAll({
      where: {
        name: body.name,
        tenantId : ctx.query.tenantId
      }
    });

    if(menusResult.length >0) {
      ctx.body = {
        "errMsg" : "菜品已存在，请重新定义"
      }
      return;
    }

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }
    let isCreate = true;
    let menus;
    if (id) {
      menus = await Menus.findById(id);
      if (menus != null) {
        menus.name = body.name;
        menus.type = body.type;

        await menus.save();
        isCreate = false;
      }
    }
    ctx.body =new ApiResult(ApiResult.Result.SUCCESS)
  },

  async getAdminMenus (ctx, next) {
    let menus = await Menus.findAll({
      where:{
        tenantId : ctx.query.tenantId
      },
      attributes:{
        exclude:['createdAt','updatedAt','deletedAt']
      },
    });

    ctx.body =new ApiResult(ApiResult.Result.SUCCESS,menus);

  },

}