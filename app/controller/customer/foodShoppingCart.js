let db = require('../../db/mysql/index');
let sequelizex = require('../../lib/sequelizex.js');
let FoodShoppingCarts = db.models.FoodShoppingCarts;
let Foods = db.models.Foods;
let Tables = db.models.Tables;
let webSocket = require('../../controller/socketManager/socketManager');
var tool = require('../../Tool/tool');

module.exports = {

  async getUserfoodShoppingCartByTableId (ctx, next) {
    ctx.checkParams('TableId').notEmpty().isInt().toInt();
    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }

    var tableId = ctx.params.TableId;
    var result = {};

    /**
     * 根据tableId查询所有购物车中的数据
     */
    var foodShoppingCarts = await FoodShoppingCarts.findAll({
      where: {
        TableId: tableId,
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    })
    var foodJson = [];

    var totalNum = 0;
    var totalPrice = 0;
    var totalVipPrice = 0;

    /**
     * 根据FoodId查询购物车中的数据
     * 返回food
     * 查询id,name,price,vipPrice的数据
     */
    for(var i = 0; i < foodShoppingCarts.length; i ++) {
      var food = await Foods.findAll({
        where: {
          id: foodShoppingCarts[i].FoodId,
        },
        attributes: ["id","name","price","vipPrice"],
      })
      foodJson[i] = {};
      foodJson[i].id = food[0].id;
      foodJson[i].name = food[0].name;
      foodJson[i].price = food[0].price;
      foodJson[i].vipPrice = food[0].vipPrice;
      foodJson[i].num = foodShoppingCarts[i].num;
      foodJson[i].unit = foodShoppingCarts[i].unit;
      foodJson[i].remark = foodShoppingCarts[i].remark;
      foodJson[i].tableUser = foodShoppingCarts[i].tableUser;
      foodJson[i].tableUserNumber = foodShoppingCarts[i].tableUserNumber;
      totalNum += foodShoppingCarts[i].num;

      totalPrice += food[0].price * foodShoppingCarts[i].num;
      totalVipPrice += food[0].vipPrice * foodShoppingCarts[i].num;
    }
    result.tableId = tableId;
    result.foods = foodJson;
    result.totalNum = totalNum;
    result.totalPrice = Math.round(totalPrice*100)/100;
    result.totalVipPrice = Math.round(totalVipPrice*100)/100;
    console.log("AAAAAAAAAAAAAAAA||totalPrice=" + totalPrice);
    console.log("BBBBBBBBBBBBBBBB||totalVipPrice=" + totalVipPrice);

    ctx.body =new ApiResult(ApiResult.Result.SUCCESS,resultArray)

  },

  async updateUserfoodShoppingCartAddById (ctx,next) {
    ctx.checkParams('id').notEmpty().isInt().toInt();
    ctx.checkBody('foods').notEmpty();
    //ctx.checkParams('tableUserNumber').notEmpty().isInt().toInt();
    //ctx.checkBody('tableUser').notEmpty();

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }

    var id = ctx.params.id; //桌号
    var body = ctx.request.body;

    var tableUserNumber = 1;

    if(body.tableUser == null) {
      body.tableUser = tool.uuid();
      var tableUserNumbers = await FoodShoppingCarts.findAll({
        where: {
          TableId: id,
        },
        attributes: ["tableUserNumber"],
      });

      if (tableUserNumbers.length > 0) {
        var tmp_tableUserNumbers = [];
        for(var i = 0 ; i <tableUserNumbers.length;i++) {
          tmp_tableUserNumbers[i] = tableUserNumbers[i].tableUserNumber;
        }
        tableUserNumber =  Math.max.apply(null,tmp_tableUserNumbers) + 1;
      }

    } else {
      var tableUserNumbers = await FoodShoppingCarts.findAll({
        where: {
          tableUser: body.tableUser,
        },
        attributes: ["tableUserNumber"],
      });
      var tmp_tableUserNumbers = [];
      for(var i = 0 ; i <tableUserNumbers.length;i++) {
        tmp_tableUserNumbers[i] = tableUserNumbers[i].tableUserNumber;
      }
      if (tmp_tableUserNumbers.length == 0) {
        tableUserNumber = 1;
      }else {
        tableUserNumber = tmp_tableUserNumbers[0];
      }
    }

    var foods = body.foods;

    var createFoodShoppingCartTask = [];

    for(var i = 0; i < foods.length; i ++) {

      var foodUnits = await Foods.findAll({
        where: {
          id: foods[i].FoodId,
        }
      });
      createFoodShoppingCartTask.push(FoodShoppingCarts.create({
        num:foods[i].num,
        unit:foodUnits[0].unit,
        FoodId: foods[i].FoodId,
        remark: foods[i].remark,
        TableId: id,
        tableUser:body.tableUser,
        tableUserNumber:tableUserNumber
      }));
    }

    await createFoodShoppingCartTask;

    //修改桌号状态

    var table = await Tables.findById(id);
    if (table != null && table.status == 0) {
      table.name = table.name;
      table.status = 1;

      await table.save();
    }

    ctx.body = {
      resCode:0,
      result:body.tableUser
    }
    ctx.body =new ApiResult(ApiResult.Result.SUCCESS,tableUser)

    //通知管理台修改桌态
    var json = {"tableId":id,"status":1};
    webSocket.sendSocket(JSON.stringify(json));

  },

  async updateUserfoodShoppingCartEditById (ctx,next) {
    ctx.checkParams('id').notEmpty().isInt().toInt();
    ctx.checkBody('FoodId').notEmpty();
    ctx.checkBody('addNum').notEmpty().isInt();
    ctx.checkBody('tableUser').notEmpty();

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }

    var id = ctx.params.id; //桌号
    var body = ctx.request.body;

    var foods = body.foods;


    var foodShoppingCarts = await FoodShoppingCarts.findAll({
      where: {
        tableUser: body.tableUser,
        FoodId: body.FoodId,
      }
    });

    if (foodShoppingCarts.length == 0) {
      ctx.body = {
        resCode:-1,
        result:"食品不存在！"
      }
      return;
    }

    if (body.addNum == 0) {
      if(body.newNum != null) {
        foodShoppingCarts[0].num = body.newNum;
        await foodShoppingCarts[0].save();
      }else {
        await foodShoppingCarts[0].destroy();
      }

    } else {
      var num = foodShoppingCarts[0].num + body.addNum;

      if(num == 0) {
        await foodShoppingCarts[0].destroy();
      } else {
        foodShoppingCarts[0].num = num;
        await foodShoppingCarts[0].save();
      }
    }


    ctx.body =new ApiResult(ApiResult.Result.SUCCESS,tableUser)



  }


}