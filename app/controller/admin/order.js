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
let Consignees=db.models.Consignees
const Coupons = db.models.Coupons


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

        if(orders==null){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"没有此订单")
            return;
        }
        orders.forEach(async function(e){
            await e.destroy();
        })

        let table = await Tables.findById(orders[0].TableId)
        if(table!=null){
            table.status=0;
            await table.save();
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
                tenantId: ctx.query.tenantId
            }
        })
        // 判断order是否为空
        if(order.length==0){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"未找到当前订单")
            return;
        }
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
                }
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
            //result[i].tableId = orders[0].tableId;

            let table = await Tables.findById(orders[0].TableId);

            result[k].tableName = table.name;
            result[k].trade_no = tradeNoArray[k];
            result[k].info = orders[0].info;
            result[k].foods = foodJson;
            result[k].totalNum = totalNum;
            result[k].totalPrice = Math.round(totalPrice * 100) / 100;
            result[k].dinersNum = orders[0].diners_num;
            result[k].paymentMethod = orders[0].paymentMethod;//支付方式
            result[k].status = orders[0].status;
            result[k].time = orders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[k].phone = orders[0].phone;
            result[k].consigneeName = (consigneesName==null?null:consigneesName.name);
            result[k].totalVipPrice = Math.round(totalVipPrice * 100) / 100;
            //根据订单号找退款信息
            let tmp = await Orders.findAll({
                where: {
                    trade_no: tradeNoArray[k],
                    tenantId: ctx.query.tenantId,
                }
            });
            if (tmp[0].trade_no != null && tmp[0].trade_no != '') {
                // console.log("OOOOOOOOOOOOOOOOOsss||" + tmp[0].trade_no);
                // console.log("tenantId = " + ctx.query.tenantId);
                let paymentReqs = await PaymentReqs.findAll({
                    where: {
                        trade_no: tmp[0].trade_no,
                        tenantId: ctx.query.tenantId
                    }
                });
                //console.log("changdu:" + paymentReqs.length);
                if(paymentReqs[k]!=null){
                    result[k].trade_no = tmp[0].trade_no;
                    result[k].total_amount = paymentReqs[0].total_amount;
                    result[k].actual_amount = paymentReqs[0].actual_amount;
                    result[k].refund_amount = paymentReqs[0].refund_amount;
                    result[k].refund_reason = paymentReqs[0].refund_reason;
                }
            }


            //通过订单号获取优惠券
            let coupon = await Coupons.findOne({
                where: {
                    trade_no: orders[0].trade_no,
                    phone: orders[0].phone,
                    tenantId: orders[0].tenantId,
                    //status: 0
                }
            })

            if (coupon != null) {
                result[k].couponType = coupon.couponType;
                result[k].couponValue = coupon.value;

                // if (coupon.couponType == 'amount') {
                //     result[k].totalPrice = ((result.totalPrice - coupon.value) <= 0) ? 0.01 : (result.totalPrice - coupon.value);
                //     result[k].totalVipPrice = ((result.totalVipPrice - coupon.value) <= 0) ? 0.01 : (result.totalVipPrice - coupon.value);
                // } else {
                //     result[k].totalPrice = result.totalPrice * coupon.value;
                //     result[k].totalVipPrice = result.totalVipPrice * coupon.value;
                // }
            }

            //判断vip
            if (orders[0].phone != null) {
                let vips = await Vips.findAll({
                    where: {
                        phone: orders[0].phone,
                        tenantId: ctx.query.tenantId
                    }
                })
                if (vips.length > 0) {
                    delete result[k].totalPrice;
                } else {
                    delete result[k].totalVipPrice;
                }
            } else {
                delete result[k].totalVipPrice;
            }
        }
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS,result)
    }
}