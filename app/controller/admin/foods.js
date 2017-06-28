const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Foods = db.models.Foods;
let Menus = db.models.Menus;
let Foodsofmenus = db.models.FoodsOfTMenus;


module.exports = {

  async saveAdminFonds (ctx, next) {
    ctx.checkBody('name').notEmpty();
    ctx.checkBody('image').notEmpty();
    ctx.checkBody('icon').notEmpty();
    ctx.checkBody('price').notEmpty().isFloat().ge(0).toFloat();
    ctx.checkBody('oldPrice').notEmpty().isFloat().ge(0).toFloat();
    ctx.checkBody('vipPrice').notEmpty().isFloat().ge(0).toFloat();
    ctx.checkBody('sellCount').notEmpty().isInt().ge(0).toInt();
    ctx.checkBody('rating').notEmpty().isInt().ge(0).toInt();
    ctx.checkBody('info').notEmpty();
    ctx.checkBody('isActive').notEmpty();
    ctx.checkBody('menuIds').notEmpty();

    let body = ctx.request.body;

    // if (!(body.menuIds instanceof Array)) {
    //     body.menuIds = [body.menuIds];
    // }
    body.menuIds = body.menuIds;

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }
    let isCreate = true;
    let createMenuTask = [];
    let foods;

    if (isCreate) {
      foods = await Foods.create({
        name: body.name,
        image: body.image,
        icon: body.icon,
        price: body.price,
        oldPrice: body.oldPrice,
        vipPrice: body.vipPrice,
        sellCount: body.sellCount,
        rating: body.rating,
        info: body.info,
        unit : body.unit,
        isActive:body.isActive,
        tenantId:ctx.query.tenantId
        // todo: ok?
        //deletedAt: Date.now()
      });

    }
    for(let i = 0; i < body.menuIds.length; i ++) {
      createMenuTask.push(Foodsofmenus.create({
        FoodId: foods.id,
        MenuId: body.menuIds[i]
      }));
    }
    await createMenuTask;
    this.body =new ApiResult(ApiResult.Result.SUCCESS)

  },

  async updateAdminFoodsById (ctx,next) {
    ctx.checkBody('name').notEmpty();
    ctx.checkBody('image').notEmpty();
    ctx.checkBody('icon').notEmpty();
    ctx.checkBody('price').notEmpty().isFloat().ge(0).toFloat();
    ctx.checkBody('oldPrice').notEmpty().isFloat().ge(0).toFloat();
    ctx.checkBody('vipPrice').notEmpty().isFloat().ge(0).toFloat();
    ctx.checkBody('sellCount').notEmpty().isInt().ge(0).toInt();
    ctx.checkBody('rating').notEmpty().isInt().ge(0).toInt();
    ctx.checkBody('info').notEmpty();
    ctx.checkBody('isActive').notEmpty();
    ctx.checkBody('menuIds').notEmpty();
    let body = ctx.request.body;
    // if (!(body.menuIds instanceof Array)) {
    //     body.menuIds = [body.menuIds];
    // }
    body.menuIds = body.menuIds;

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }

    let isCreate = true;
    let createMenuTask = [];
    let foods;
    if (ctx.params.id) {
      foods = await Foods.findById(ctx.params.id);
      if (foods != null) {
        foods.name = body.name;
        foods.image = body.image;
        foods.icon = body.icon;
        foods.price = body.price;
        foods.oldPrice = body.oldPrice;
        foods.vipPrice = body.vipPrice;
        foods.sellCount = body.sellCount;
        foods.rating = body.rating;
        foods.info = body.info;
        foods.unit = body.unit;
        foods.isActive = body.isActive;

        await foods.save();
        createMenuTask.push(Foodsofmenus.destroy({
          where: {
            FoodId: foods.id
          },
          force:true
        }));

        await createMenuTask;

        createMenuTask = [];

        isCreate = false;
      }
    }
    this.body =new ApiResult(ApiResult.Result.SUCCESS)
  },

  async getAdminFoods (ctx, next) {
    let foods = await Foods.findAll({
      where:{
        tenantId:ctx.query.tenantId
      }
    });
    let foodId;
    let menuName;
    let menuId;
    let foodsJson = [];
    for(let i = 0; i < foods.length; i ++) {
      foodId = foods[i].id;
      menuId = await Foodsofmenus.findAll({
        where:{
          FoodId:foodId
        },
        attributes: [
          'MenuId'
        ]
      });
      if(menuId.length == 0) {
        continue;
      }
      menuName = await Menus.findAll({
        where:{
          id:menuId[0].MenuId
        },
        attributes: [
          'name'
        ]
      });
      foodsJson[i] = {};
      foodsJson[i].id = foods[i].id;
      foodsJson[i].name = foods[i].name;
      foodsJson[i].image = foods[i].image;
      foodsJson[i].icon = foods[i].icon;
      foodsJson[i].price = foods[i].price;
      foodsJson[i].oldPrice = foods[i].oldPrice;
      foodsJson[i].vipPrice = foods[i].vipPrice;
      foodsJson[i].isActive = foods[i].isActive;
      foodsJson[i].name = foods[i].name;
      foodsJson[i].menuName = menuName[0].name;
      foodsJson[i].unit = foods[i].unit;

    }
    this.body =new ApiResult(ApiResult.Result.SUCCESS,foodsJson);

  },

}