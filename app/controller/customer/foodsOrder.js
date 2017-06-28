const db = require('../../db/mysql/index');
const sequelizex = require('../../lib/sequelizex.js');
const FoodOrders = db.models.FoodOrders;
const Foods = db.models.Foods;
const Tables = db.models.Tables;
const FoodShoppingCarts = db.models.FoodShoppingCarts;
const Vips = db.models.Vips;
const PaymentReqs = db.models.PaymentReqs;
const webSocket = require('../../controller/socketManager/socketManager');
const infoPushManager = require('../../controller/infoPush/infoPush');
const tool = require('../../Tool/tool');

module.exports = {

  async getUserfoodOrderByTableId (ctx, next) {
    ctx.checkParams('TableId').notEmpty().isInt().toInt();
    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }

    let tableId = ctx.params.TableId;
    let trade_no =  ctx.query.trade_no;
    let result = {};
    let foodOrders;
    let foodOrderIdArr = [];

    if (trade_no != undefined) {
      trade_no = trade_no;
    }
    if (trade_no != undefined) {
      foodOrders = await FoodOrders.findAll({
        where: {
          TableId: tableId,
          trade_no:trade_no,

        },
        attributes: {
          exclude: ['updatedAt']
        }
      })
    } else {
      foodOrders = await FoodOrders.findAll({
        where: {
          TableId: tableId,
          $or: [{status : 0}, {status : 1}] ,

        },
        attributes: {
          exclude: ['updatedAt']
        }
      })
    }
    let foodJson = [];
    let totalNum = 0;
    let totalPrice = 0;
    let totalVipPrice = 0;

    for(let i = 0; i < foodOrders.length; i ++) {
      let food = await Foods.findAll({
        where: {
          id: foodOrders[i].FoodId,
        },
        attributes: ["id","name","price","vipPrice"],
      })
      foodJson[i] = {};
      foodJson[i].id = food[0].id;
      foodJson[i].name = food[0].name;
      foodJson[i].price = food[0].price;
      foodJson[i].vipPrice = food[0].vipPrice;
      foodJson[i].num = foodOrders[i].num;
      foodJson[i].unit = foodOrders[i].unit;
      foodOrderIdArr.push(foodOrders[i].id);
      totalNum += foodOrders[i].num;
      totalPrice += food[0].price * foodOrders[i].num;//原价
      totalVipPrice += food[0].vipPrice * foodOrders[i].num;//会员价
    }
    result.tableId = tableId;
    result.foods = foodJson;
    result.totalNum = totalNum;
    result.totalPrice = Math.round(totalPrice*100)/100;
    if (foodOrders[0] != null) {
      result.totalVipPrice = Math.round(totalVipPrice*100)/100;
      result.foodsOrderId = foodOrderIdArr;
      result.time = foodOrders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
      result.info = foodOrders[0].info;
      result.status = foodOrders[0].status;
      result.diners_num = foodOrders[0].diners_num;
      //判断vip
      if (foodOrders[0].phone != null) {
        let vips = await Vips.findAll({
          where:{
            phone:foodOrders[0].phone,
            tenantId:ctx.query.tenantId
          }
        })
        if (vips.length > 0) {
          result.discount = Math.round((result.totalPrice - result.totalVipPrice) *100)/100;
          delete result.totalPrice;
        }else {
          delete result.totalVipPrice;
        }
      } else {
        delete result.totalVipPrice;
      }
    }
    ctx.body =new ApiResult(ApiResult.Result.SUCCESS,result)

  },

  async updateUserfoodOrderByTableId (ctx,next) {
    ctx.checkParams('TableId').notEmpty().isInt().toInt();
    ctx.checkBody('phone').notEmpty().isInt().toInt();
    ctx.checkBody('dinersNum').notEmpty().isInt().toInt();
    //  ctx.checkBody('foods').notEmpty();

    if (ctx.errors) {
      ctx.body = ctx.errors;
      return;
    }

    let id = ctx.params.TableId; //桌号

    let body = ctx.request.body;
    let phone = body.phone; //手机号

    //let foodsJson = body.foods;
    //从购物车获取
    let foodsJson = await FoodShoppingCarts.findAll({
      where: {
        TableId: id
      },
      attributes: ["FoodId","num",'unit'],
    })

    //时间戳+tableId生成商家订单号
    let own_trade_no = new Date().format("yyyyMMddhhmmssS") + id;
    for(let i = 0; i < foodsJson.length; i ++) {
      // let foods = await Foods.findAll({
      //     where: {
      //         name: foodsJson[i].name,
      //     }
      // })

      await FoodOrders.create({
        num:foodsJson[i].num,
        unit:foodsJson[i].unit,
        FoodId: foodsJson[i].FoodId,
        phone: phone,
        TableId: id,
        info:body.info,
        trade_no:"",
        diners_num:body.dinersNum,
        own_trade_no:own_trade_no,
        status:0,
        tenantId:ctx.query.tenantId,
        consignee:ctx.query.consignee || ""
      });
    }

    //清空购物车
    await FoodShoppingCarts.destroy({
      where: {
        TableId: id
      }
    })

    //修改桌号状态
    let table = await Tables.findById(id);
    if (table != null) {
      table.name = table.name;
      table.status = 2;//已下单

      await table.save();
    } else {
      ctx.body = {
        resCode:-1,
        result:"桌号不存在！"
      }
    }


    //查询是否有临时支付请求，有的话使其失效
    let paymentReqs = await PaymentReqs.findAll({
      where: {
        tableId : id,
        isFinish : false,
        isInvalid : false
      }
    });

    for(i = 0;i<paymentReqs.length;i++) {
      paymentReqs[i].isInvalid = true;
      paymentReqs[i].save();
    }

    ctx.body = {
      resCode:0,
      result:{}
    }

    //下单成功发送推送消息
    let date = new Date().format("hh:mm");
    let content = table.name + '已下单成功，请及时处理！ ' +date;
    infoPushManager.infoPush(content,ctx.query.tenantId);

    //通知管理台修改桌态
    let json = {"tableId":id,"status":2};
    webSocket.sendSocket(JSON.stringify(json));
  },

}