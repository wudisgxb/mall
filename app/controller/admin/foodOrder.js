const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
var db = require('../../db/mysql/index');
var FoodOrders = db.models.FoodOrders;
var Foods = db.models.Foods;
var Vips = db.models.Vips;
var PaymentReqs = db.models.PaymentReqs;
var Tables = db.models.Tables;


module.exports = {

  async getAdminFoodOrder (ctx, next) {
    let result = [];
    let foodJson = [];
    let totalNum = 0;
    let totalPrice = 0;
    let totalVipPrice = 0;
    let startTime = null;
    let endTime = null;
    if (ctx.query.startTime != null) {
      startTime = new Date(this.query.startTime);
      console.log("startTime:" + startTime);
    } else {
      startTime = '2000-05-14T06:12:22.000Z';
    }
    if (ctx.query.endTime != null) {
      endTime = new Date(this.query.endTime);
    } else {
      endTime = '2200-05-14T06:12:22.000Z';
    }

    let isAlreadyPaid = ctx.query.isAlreadyPaid;
    let foodOrders;
    if (isAlreadyPaid == undefined) {
      foodOrders = await FoodOrders.findAll({
        where: {
          createdAt: {
            $between:[startTime,endTime]
          },
          tenantId:ctx.query.tenantId
        },
        attributes: {
          exclude: ['updatedAt']
        }
      })

    } else {
      if (isAlreadyPaid == true) {
        foodOrders = await FoodOrders.findAll({
          where: {
            createdAt: {
              $between:[startTime,endTime]
            },
            tenantId:ctx.query.tenantId,
            status : 2
          },
          attributes: {
            exclude: ['updatedAt']
          }
        })
      } else {
        foodOrders = await FoodOrders.findAll({
          where: {
            createdAt: {
              $between:[startTime,endTime]
            },
            tenantId:ctx.query.tenantId,
            $or: [{status : 0}, {status : 1}] ,
          },
          attributes: {
            exclude: ['updatedAt']
          }
        })
      }
    }

    let tradeNoArray = [];
    for(var i = 0; i < foodOrders.length; i ++) {
      if (!tradeNoArray.contains(foodOrders[i].own_trade_no)) {
        tradeNoArray.push(foodOrders[i].own_trade_no);
      }
    }

    //再次查询
    for (i=0;i<tradeNoArray.length;i++) {
      totalNum = 0;
      totalPrice = 0;
      totalVipPrice = 0;
      foodJson = [];
      foodOrders = await FoodOrders.findAll({
        where: {
          createdAt: {
            $between:[startTime,endTime]
          },
          own_trade_no:tradeNoArray[i]
        },
        attributes: {
          exclude: ['updatedAt']
        }
      })
      for(let j = 0; j < foodOrders.length; j++) {
        let food = await Foods.findAll({
          where: {
            id: foodOrders[j].FoodId,
          }
        })
        foodJson[j] = {};
        foodJson[j].id = food[0].id;
        foodJson[j].name = food[0].name;
        foodJson[j].price = food[0].price;
        foodJson[j].vipPrice = food[0].vipPrice;
        foodJson[j].num = foodOrders[j].num;
        foodJson[j].unit = foodOrders[j].unit;
        totalNum += foodOrders[j].num;
        totalPrice += food[0].price * foodOrders[j].num;//原价
        totalVipPrice += food[0].vipPrice * foodOrders[j].num;//会员价
      }
      result[i] = {};
      //result[i].tableId = foodOrders[0].tableId;
      let table = await Tables.findById(foodOrders[0].TableId);
      result[i].tableName = table.name;
      result[i].own_trade_no = tradeNoArray[i];
      result[i].info = foodOrders[0].info;
      result[i].foods = foodJson;
      result[i].totalNum = totalNum;
      result[i].totalPrice = Math.round(totalPrice*100)/100;
      result[i].dinersNum = foodOrders[0].diners_num;
      result[i].paymentMethod = foodOrders[0].paymentMethod;//支付方式
      result[i].status = foodOrders[0].status;
      result[i].time = foodOrders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
      result[i].phone =  foodOrders[0].phone;
      result[i].consignee = foodOrders[0].consignee;
      result[i].totalVipPrice = Math.round(totalVipPrice*100)/100;

      //根据订单号找退款信息
      let tmp = await FoodOrders.findAll({
        where: {
          own_trade_no:tradeNoArray[i],
          tenantId:ctx.query.tenantId,
        }
      });
      if(tmp[0].trade_no != null && tmp[0].trade_no != '') {
        console.log("OOOOOOOOOOOOOOOOOsss||" + tmp[0].trade_no);
        console.log("tenantId = " + ctx.query.tenantId);
        let paymentReqs = await PaymentReqs.findAll({
          where: {
            trade_no:tmp[0].trade_no,
            tenantId:ctx.query.tenantId,
          }
        });
        console.log("changdu:" + paymentReqs.length);
        result[i].trade_no = tmp[0].trade_no;
        result[i].total_amount = paymentReqs[0].total_amount;
        result[i].actual_amount = paymentReqs[0].actual_amount;
        result[i].refund_amount = paymentReqs[0].refund_amount;
        result[i].refund_reason = paymentReqs[0].refund_reason;
      }

      //判断vip
      if (foodOrders[0].phone != null) {
        let vips = await Vips.findAll({
          where:{
            phone:foodOrders[0].phone,
            tenantId:ctx.query.tenantId
          }
        })
        if (vips.length > 0) {
          delete result[i].totalPrice;
        }else {
          delete result[i].totalVipPrice;
        }
      } else {
        delete result[i].totalVipPrice;
      }
    }

    this.body =new ApiResult(ApiResult.Result.SUCCESS);
  },
  async modifyTableStatus (tableId,tableStatus) {
    let table = await Tables.findById(tableId);
    table.status = tableStatus;
    await  table.save();
    if (tableStatus == 0) {
      let paymentReqs = PaymentReqs.findAll({
        where:{
          tableId:tableId,
          isFinish:false,
          isInvalid:false
        }
      });
      if (paymentReqs.length >0) {
        for(let i =0;i<paymentReqs.length;i++) {
          paymentReqs[i].isInvalid = true;
          await paymentReqs[i].save();
        }
      }
    } else {

    }
    return Promise.resolve(null);
  },
  async updateAdminFoodOrderByEditId (ctx, next) {
    this.checkParams('id').notEmpty().isInt().toInt();
    this.checkBody('FoodId').notEmpty();
    this.checkBody('addNum').notEmpty().isInt();
    this.checkBody('tableUser').notEmpty();

    if (this.errors) {
      this.body = this.errors;
      return;
    }

    let id = this.params.id; //桌号
    let body = this.request.body;

    let foods = body.foods;


    let foodShoppingCarts = await FoodShoppingCarts.findAll({
      where: {
        tableUser: body.tableUser,
        FoodId: body.FoodId,
      }
    });

    if (foodShoppingCarts.length == 0) {
      this.body = {
        resCode:-1,
        result:"食品不存在！"
      }
      return;
    }
    let num = foodShoppingCarts[0].num + body.addNum;

    if(num == 0) {
      foodShoppingCarts[0].destroy();
    } else {
      foodShoppingCarts[0].num = num;
      foodShoppingCarts[0].save();
    }


    this.body =new ApiResult(ApiResult.Result.SUCCESS);
  },
  async deleteAdminFoodOrderTableId (ctx, next) {
    this.checkParams('tableId');

    if (this.errors) {
      this.body = this.errors;
      return;
    }

    let tableId = this.params.tableId; //订单id

    let foodOrders = await FoodOrders.findAll({
      where:{
        TableId:tableId,
        tenantId:this.query.tenantId,
        $or: [{status : 0}, {status : 1}]
      }
    });



    if(foodOrders.length >0) {
      foodOrders.forEach(async function (e) {
        await e.destroy();
      })
    } else {
      this.body = {
        resCode:0,
        result:"订单不存在"
      }
    }
    await modifyTableStatus(tableId,0);

    this.body =new ApiResult(ApiResult.Result.SUCCESS);
  }
}