const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
var db = require('../../db/mysql/index');
var Orders = db.models.Orders;
var ShoppingCarts = db.models.ShoppingCarts;
var Foods = db.models.Foods;
var Vips = db.models.Vips;
var PaymentReqs = db.models.PaymentReqs;
var Tables = db.models.Tables;
let Consignees = db.models.Consignees
const Coupons = db.models.Coupons
const DistanceAndPrices = db.models.DistanceAndPrices
const DeliveryFees = db.models.DeliveryFees
const vipManager = require('../customer/vip');
const amoutManager = require('../amount/amountManager')

module.exports ={

    async deleteAdminOrderTenantId(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tradeNo').notEmpty();
        if(ctx.errors){
            ctx.body=new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let orders = await Orders.findAll({
            where:{
                tenantId:ctx.query.tenantId,
                trade_no:ctx.query.tradeNo,
               //consigneeId:null
            }
        })

        if(orders.length==0){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"没有此订单")
            return;
        }
        let tableId = [];
        for(let i =0;i<orders.length;i++){
            await orders[i].destroy();
            if(!tableId.contains(orders[i].TableId)){
                tableId.push(orders[i].TableId)
            }
        }
        for(let j = 0; j < tableId.length; j++){
            let table = await Tables.findById(tableId[j])
            if(table!=null){
                table.status=0;
                await table.save();
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async deleteAdminOrderConsigneeId(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tradeNo').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        if(ctx.errors){
            ctx.body=new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let order = await Orders.findOne({
            where:{
                tenantId:ctx.query.tenantId,
                trade_no:ctx.query.tradeNo,
                consigneeId:ctx.query.consigneeId
            }
        })
        if(order==null){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"没有此订单")
            return;
        }
        await order.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    //async getAdminOrder(ctx, next){},
    async getAdminOrder(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        let result = [];
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
        let startTime = null;
        let endTime = null;
        if(ctx.errors){
            ctx.body=new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        if(ctx.query.startTime==null){
            startTime='2000-05-14T06:12:22.000Z'
        }else{
            startTime = new Date(ctx.query.startTime);
        }
        if(ctx.query.endTime==null){
            endTime='2100-05-14T06:12:22.000Z'
        }else{
            endTime = new Date(ctx.query.endTime);
        }
        let orders;
        //根据tenantId，查询当前时间的订单
        let order = await Orders.findAll({
            where: {
                createdAt: {
                    $between: [startTime, endTime]
                },
                tenantId: ctx.query.tenantId,
            }
        })
        //判断order是否为空
        // if(order.length==0){
        //     ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"未找到当前订单")
        //     return;
        // }
        let tradeNoArray = [];//订单号
        for (var i = 0; i < order.length; i++) {
            if (!tradeNoArray.contains(order[i].trade_no)) {
                tradeNoArray.push(order[i].trade_no);
            }
        }
        //循环不相同的订单号
        for(let k = 0;k<tradeNoArray.length;k++){
            totalNum = 0;//数量
            totalPrice = 0;//单价
            totalVipPrice = 0;//会员价
            //价格的数组
            foodJson = [];
            //根据订单号查询consigneeId
            let consigneesId = await Orders.findOne({
                where:{
                    // createdAt: {
                    //     $between: [startTime, endTime]
                    // },
                    trade_no:tradeNoArray[k]
                }
            })
            //根据consigneeId查询consigneeName
            let consigneesName=await Consignees.findOne({
                where:{
                    consigneeId:consigneesId.consigneeId
                }
            })
            //根据创建时间和订单号查询所有记录
            orders = await Orders.findAll({
                where: {
                    createdAt: {
                        $between:[startTime,endTime]
                    },
                    trade_no:tradeNoArray[k]
                },
                order:[["createdAt","DESC"]]
            })

            for(var j = 0; j < orders.length; j++) {
                //根据菜单号查询菜单
                let food = await Foods.findOne({
                    where: {
                        id: orders[j].FoodId,
                    }
                })

                foodJson[j] = {};
                foodJson[j].id = food.id;
                foodJson[j].name =food.name;
                foodJson[j].price = food.price;
                foodJson[j].vipPrice = food.vipPrice;
                //  foodJson[k].consigneeName=(consigneesName.name==null?null:consigneesName.name);
                foodJson[j].num = orders[j].num;
                foodJson[j].unit = orders[j].unit;
                //总数量为每个循环的数量现价
                totalNum += orders[j].num;
                //当前菜的总价格为菜品的价格*订单中购买的数量
                totalPrice += food.price * orders[j].num;//原价
                //会员价为菜品的会员价*订单中购买的数量
                totalVipPrice += food.vipPrice * orders[j].num;//会员价
            }

            result[k] = {};

            let table = await Tables.findById(orders[0].TableId);

            result[k].tableName = table.name;
            result[k].trade_no = tradeNoArray[k];
            result[k].info = orders[0].info;
            result[k].id = orders[0].id
            result[k].foods = foodJson;
            result[k].totalNum = totalNum;
            //result[k].totalPrice = Math.round(totalPrice * 100) / 100;
            result[k].dinersNum = orders[0].diners_num;
            result[k].paymentMethod = orders[0].paymentMethod;//支付方式
            result[k].status = orders[0].status;
            result[k].time = orders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[k].phone = orders[0].phone;
            result[k].consigneeId = consigneesId.consigneeId;
            result[k].consigneeName = consigneesName==null?null:consigneesName.name;
            //result[k].totalVipPrice = Math.round(totalVipPrice * 100) / 100;

            let refund_amount = 0;
            
            let paymentReq = await PaymentReqs.findOne({
                where: {
                    trade_no: tradeNoArray[k],
                    tenantId: ctx.query.tenantId
                }
            });

            if (paymentReq != null) {
                result[k].total_amount = paymentReq.total_amount;
                result[k].actual_amount = paymentReq.actual_amount;
                result[k].refund_amount = paymentReq.refund_amount;
                result[k].refund_reason = paymentReq.refund_reason;

                refund_amount = paymentReq.refund_amount;
            }
            
            let amount = await amoutManager.getTransAccountAmount(ctx.query.tenantId, consigneesId.consigneeId, tradeNoArray[k], orders[0].paymentMethod, refund_amount);

            //简单异常处理
            if (amount.totalAmount >0) {
                result[k].totalPrice =  amount.totalPrice;
                result[k].platformCouponFee = amount.platformCouponFee;
                result[k].merchantCouponFee = amount.merchantCouponFee;
                result[k].deliveryFee = amount.deliveryFee;
                result[k].refund_amount = refund_amount;
                result[k].platformAmount  = amount.platformAmount;
                result[k].merchantAmount = amount.merchantAmount;
                result[k].consigneeAmount = amount.consigneeAmount;
                result[k].couponType = amount.couponType;
                result[k].couponValue = amount.couponValue;
            } else {
                result[k].totalPrice = 0;
                result[k].platformCouponFee = 0;
                result[k].merchantCouponFee = 0;
                result[k].deliveryFee = 0;
                result[k].refund_amount = 0;
                result[k].platformAmount  = 0;
                result[k].merchantAmount = 0;
                result[k].consigneeAmount = 0;
                result[k].couponType = null;
                result[k].couponValue = null
            }


        }
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS,result)
    },

    async saveAdminOrder(ctx,next){
        ctx.checkBody("/order/num",true).first().notEmpty();
        ctx.checkBody("/order/status",true).first().notEmpty();
        ctx.checkBody("/order/info",true).first().notEmpty();
        ctx.checkBody("/order/phone",true).first().notEmpty();
        ctx.checkBody("/order/diners_num",true).first().notEmpty();
        ctx.checkBody("/order/trade_no",true).first().notEmpty();
        ctx.checkBody("/order/paymentMethod",true).first().notEmpty();
        ctx.checkBody("/order/unit",true).first().notEmpty();
        ctx.checkBody("/order/TableId",true).first().notEmpty();
        ctx.checkBody("/order/FoodId",true).first().notEmpty();
        ctx.checkBody("/order/createdAt",true).first().notEmpty();
        ctx.checkBody("/condition/tenantId",true).first().notEmpty();
        let body = ctx.request.body;
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
        }
        let foodId = [];
        foodId = body.order.FoodId;
        for(let i = 0; i<foodId.length;i++){
            await Orders.create({
                num:body.order.num,
                status:body.order.status,
                info:body.order.info,
                phone:body.order.phone,
                diners_num:body.order.diners_num,
                trade_no:body.order.trade_no,
                paymentMethod:body.order.paymentMethod,
                unit:body.order.unit,
                TableId:body.order.TableId,
                FoodId:foodId[i],
                createdAt:body.order.createdAt,
                tenantId:body.condition.tenantId,
                consigneeId:body.condition.consigneeId
            })
        }
        // await Orders.create({
        //     num:body.order.num,
        //     status:body.order.status,
        //     info:body.order.info,
        //     phone:body.order.phone,
        //     diners_num:body.order.diners_num,
        //     trade_no:body.order.trade_no,
        //     paymentMethod:body.order.paymentMethod,
        //     unit:body.order.unit,
        //     TableId:body.order.TableId,
        //     FoodId:foodId[i],
        //     createdAt:body.order.createdAt,
        //     tenantId:body.condition.tenantId,
        //     consigneeId:body.condition.consigneeId
        // })

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }

}