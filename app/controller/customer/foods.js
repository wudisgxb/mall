const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
var util = require('util');
var moment = require('moment');

let Foods = db.models.Foods;
let Menus = db.models.Menus;
let Foodsofmenus = db.models.FoodsOfTMenus;
let Ratings = db.models.Ratings;
let ChildAlipayConfigs = db.models.ChildAlipayConfigs;


module.exports = {

  async getUserMenus (ctx, next) {
    let menuId =  ctx.query.id;
    let tenantId =  ctx.query.tenantId;
    let consignee = ctx.query.consignee;

    let excludeFoodIdArray = [];
    if (consignee != null) {
      console.log(tenantId);
      console.log(consignee);
      let childAlipayConfigs = await ChildAlipayConfigs.findAll({
        where:{
          tenantId:tenantId,
          merchant:consignee
        }
      });
      console.log("childAlipayConfigs===========" + childAlipayConfigs.length);
      if (childAlipayConfigs.length >0) {
        excludeFoodIdArray = JSON.parse(childAlipayConfigs[0].excludeFoodId);
        console.log(excludeFoodIdArray);
      }
    }

    if (menuId == null) {
      let menus = await Menus.findAll({
        where:{
          tenantId:tenantId
        },
        attributes: [
          'id',
          'name',
          'type'
        ]});
    } else {
      let menus = await Menus.findAll({
        where: {
          id:menuId,
        },
        attributes: [
          'id',
          'name',
          'type'
        ]});
    }

    let resultArray = [];

    let foodsofmenus;
    let foodArray = [];
    for(let i = 0; i < menus.length; i ++) {
      foodsofmenus = await Foodsofmenus.findAll({
        where: {
          MenuId:menus[i].id ,
        }
      });
      let food;
      for(let j = 0; j < foodsofmenus.length; j ++) {
        if (excludeFoodIdArray != null && excludeFoodIdArray.length>0 && excludeFoodIdArray.indexOf(foodsofmenus[j].FoodId) != -1) {
          console.log("GGGGGGGGGGG||" + foodsofmenus[j].FoodId);
          console.log("HHHHHHHHHHH||" + excludeFoodIdArray.indexOf(foodsofmenus[j].FoodId))
          continue;
        }
        food = await Foods.findAll({
          where: {
            id:foodsofmenus[j].FoodId ,
            isActive:true,
          },
          attributes:{
            exclude:['createdAt','updatedAt','deletedAt','isActive']
          },
          include: [{
            model: Ratings,
            where: { FoodId: foodsofmenus[j].FoodId},
            required:false,
            attributes: [
              'username',
              'rateTime',
              'rateType',
              'text',
              'avatar'
            ]
          }]
        });

        food.forEach(e => {
          e.Ratings = e.Ratings.map(rating => {
            rating.username = rating.username.slice(0, 3) + '****' + rating.username.slice(-4)
            return rating
          })
        })

        foodArray.push(food[0]);
      }

      resultArray[i] = {};
      resultArray[i].id = menus[i].id;
      resultArray[i].name = menus[i].name;
      resultArray[i].type = menus[i].type;
      resultArray[i].foods = foodArray;
      foodArray = []
    }
    ctx.body =new ApiResult(ApiResult.Result.SUCCESS,resultArray)

  },

  async saveUserReting (ctx,next) {
    ctx.checkBody('userName').notEmpty();
    ctx.checkBody('text').notEmpty();
    ctx.checkBody('avatar').notEmpty();
    ctx.checkBody('tenantId').notEmpty();
    ctx.checkBody('FoodId').notEmpty();
    let body = ctx.request.body;
    await Ratings.create({
      username : body.userName,
      rateTime : new Date(),
      text : body.text,
      avatar : body.avatar || 'http://static.galileo.xiaojukeji.com/static/tms/default_header.png',
      tenantId : body.tenantId,
      FoodId:body.FoodId,
    });
    ctx.body =new ApiResult(ApiResult.Result.SUCCESS)
  }


}