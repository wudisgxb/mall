const ApiError = require('../../db/mongo/ApiError');
const ApiResult = require('../../db/mongo/ApiResult');
const logger = require('koa-log4').getLogger('AddressController');
const db = require('../../db/mysql/index');
const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
var Foods = db.models.Foods;
var PaymentReqs = db.models.PaymentReqs;
var Tables = db.models.Tables;
let Consignees = db.models.Consignees;
const amoutManager = require('../amount/amountManager');

module.exports = {

    async deleteAdminOrderTenantId(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tradeNo').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let order = await Orders.findOne({
            where: {
                tenantId: ctx.query.tenantId,
                trade_no: ctx.query.tradeNo,
                //consigneeId:null
            }
        });

        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此订单");
            return;
        }


        await order.destroy();

        let table = await Tables.findById(order.TableId);
        if (table != null) {
            table.status = 0;
            await table.save();
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async deleteAdminOrderConsigneeId(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tradeNo').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let order = await Orders.findOne({
            where: {
                tenantId: ctx.query.tenantId,
                trade_no: ctx.query.tradeNo,
                consigneeId: ctx.query.consigneeId
            }
        });
        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此订单");
            return;
        }
        await order.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    //async getAdminOrder(ctx, next){},
    async getAdminOrder(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        let result = [];
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
        let startTime = null;
        let endTime = null;
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
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        //页码
        let pageNumber = parseInt(ctx.query.pageNumber);
        //每页显示的大小
        let pageSize = parseInt(ctx.query.pageSize);
        let place = (pageNumber-1)*pageSize;
        //根据tenantId，查询当前时间的订单
        let orders=[];
        if(ctx.query.pageNumber==null&&ctx.query.pageSize==null){
             orders = await Orders.findAll({
                where: {
                    tenantId:ctx.query.tenantId ,
                    createdAt: {
                        $between: [startTime, endTime]
                    }
                }
            })
        }else{
            orders = await Orders.findAll({
                where: {
                    tenantId:ctx.query.tenantId
                },
                order:[['createdAt','DESC']],
                offset : place,
                limit : pageSize
            })
        }

        //循环不相同的订单号
        let order;
        let orderGoods;
        for (let k = 0; k < orders.length; k++) {
            totalNum = 0;//数量
            totalPrice = 0;//单价
            totalVipPrice = 0;//会员价
            //价格的数组
            foodJson = [];

            //根据consigneeId查询consigneeName
            let consignee = await Consignees.findOne({
                where: {
                    consigneeId: orders[k].consigneeId
                }
            });
            //根据创建时间和订单号查询所有记录
            orderGoods = await OrderGoods.findAll({
                where: {
                    trade_no: orders[k].trade_no
                }
            });

            for (var j = 0; j < orderGoods.length; j++) {
                //根据菜单号查询菜单
                let food = await Foods.findOne({
                    where: {
                        id: orderGoods[j].FoodId,
                    }
                });

                foodJson[j] = {};
                foodJson[j].id = food.id;
                foodJson[j].name = food.name;
                foodJson[j].price = food.price;
                foodJson[j].vipPrice = food.vipPrice;
                //  foodJson[k].consigneeName=(consigneesName.name==null?null:consigneesName.name);
                foodJson[j].num = orderGoods[j].num;
                foodJson[j].unit = orderGoods[j].unit;
                //总数量为每个循环的数量现价
                totalNum += orderGoods[j].num;
                //当前菜的总价格为菜品的价格*订单中购买的数量
                totalPrice += food.price * orderGoods[j].num;//原价
                //会员价为菜品的会员价*订单中购买的数量
                totalVipPrice += food.vipPrice * orderGoods[j].num;//会员价
            }

            result[k] = {};

            let table = await Tables.findById(orders[k].TableId);

            result[k].tableName = table.name;
            result[k].trade_no = orders[k].trade_no;
            result[k].info = orders[k].info;
            result[k].id = orders[k].id;
            result[k].byzType = orders[k].byzType;
            result[k].deliveryTime = orders[k].deliveryTime
            result[k].foods = foodJson;
            result[k].totalNum = totalNum;
            //result[k].totalPrice = Math.round(totalPrice * 100) / 100;
            result[k].dinersNum = orders[k].diners_num;
            result[k].status = orders[k].status;
            result[k].time = orders[k].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[k].phone = orders[k].phone;
            result[k].consigneeId =orders[k].consigneeId;
            result[k].consigneeId = orders[k].consigneeId;
            result[k].consigneeName = consignee == null ? null : consignee.name;
            //result[k].totalVipPrice = Math.round(totalVipPrice * 100) / 100;

            let refund_amount = 0;

            let paymentReq = await PaymentReqs.findOne({
                where: {
                    trade_no: orders[k].trade_no,
                    tenantId: ctx.query.tenantId
                }
            });

            if (paymentReq != null) {
                result[k].total_amount = paymentReq.total_amount;
                result[k].actual_amount = paymentReq.actual_amount;
                result[k].refund_amount = paymentReq.refund_amount;
                result[k].refund_reason = paymentReq.refund_reason;
                result[k].paymentMethod = paymentReq.paymentMethod;//支付方式
                refund_amount = paymentReq.refund_amount;
            } else {
                console.log("重要信息，未找到支付请求，订单号=========" + orders[k].trade_no);
            }

            let amount = await amoutManager.getTransAccountAmount
            (ctx.query.tenantId, orders[k].consigneeId, orders[k].trade_no, result[k].paymentMethod, refund_amount);

            //简单异常处理
            if (amount.totalAmount > 0) {
                result[k].totalPrice = amount.totalPrice;
                result[k].platformCouponFee = amount.platformCouponFee;
                result[k].merchantCouponFee = amount.merchantCouponFee;
                result[k].deliveryFee = amount.deliveryFee;
                result[k].refund_amount = refund_amount;
                result[k].platformAmount = amount.platformAmount;
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
                result[k].platformAmount = 0;
                result[k].merchantAmount = 0;
                result[k].consigneeAmount = 0;
                result[k].couponType = null;
                result[k].couponValue = null
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },

    // async saveAdminOrder(ctx, next){
    //     ctx.checkBody("/order/num", true).first().notEmpty();
    //     ctx.checkBody("/order/status", true).first().notEmpty();
    //     ctx.checkBody("/order/info", true).first().notEmpty();
    //     ctx.checkBody("/order/phone", true).first().notEmpty();
    //     ctx.checkBody("/order/diners_num", true).first().notEmpty();
    //     ctx.checkBody("/order/trade_no", true).first().notEmpty();
    //     ctx.checkBody("/order/paymentMethod", true).first().notEmpty();
    //     ctx.checkBody("/order/unit", true).first().notEmpty();
    //     ctx.checkBody("/order/TableId", true).first().notEmpty();
    //     ctx.checkBody("/order/FoodId", true).first().notEmpty();
    //     ctx.checkBody("/order/createdAt", true).first().notEmpty();
    //     ctx.checkBody("/condition/tenantId", true).first().notEmpty();
    //     let body = ctx.request.body;
    //     if (ctx.errors) {
    //         ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
    //     }
    //     let foodId = [];
    //     foodId = body.order.FoodId;
    //     for (let i = 0; i < foodId.length; i++) {
    //         await Orders.create({
    //             num: body.order.num,
    //             status: body.order.status,
    //             info: body.order.info,
    //             phone: body.order.phone,
    //             diners_num: body.order.diners_num,
    //             trade_no: body.order.trade_no,
    //             paymentMethod: body.order.paymentMethod,
    //             unit: body.order.unit,
    //             TableId: body.order.TableId,
    //             FoodId: foodId[i],
    //             createdAt: body.order.createdAt,
    //             tenantId: body.condition.tenantId,
    //             consigneeId: body.condition.consigneeId
    //         })
    //     }
    //     // await Orders.create({
    //     //     num:body.order.num,
    //     //     status:body.order.status,
    //     //     info:body.order.info,
    //     //     phone:body.order.phone,
    //     //     diners_num:body.order.diners_num,
    //     //     trade_no:body.order.trade_no,
    //     //     paymentMethod:body.order.paymentMethod,
    //     //     unit:body.order.unit,
    //     //     TableId:body.order.TableId,
    //     //     FoodId:foodId[i],
    //     //     createdAt:body.order.createdAt,
    //     //     tenantId:body.condition.tenantId,
    //     //     consigneeId:body.condition.consigneeId
    //     // })
    //
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    // }
    //根据tenantId查询order总记录
    async getAdminOrderByCount(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let orderOfCount = await Orders.count({
            where:{
                tenantId : ctx.query.tenantId
            }
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orderOfCount)
    },
    //修改订单状态
    async putAdminOrderByStatus(ctx,next){
        ctx.checkBody('trade_no').notEmpty();
        ctx.checkBody('status').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body
        let order = await Orders.findOne({
            where : {
                trade_no : body.trade_no
            }
        });
        // logger.info(order);
        if(order == null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此记录");
            return;
        }

        await Orders.update({
            status : body.status
        },{
            where:{
                trade_no : body.trade_no
            }
        })

        let orderBystatus = await Orders.findOne({
            where : {
                trade_no : body.trade_no
            }
        });
        let orderstatus = {
            status : orderBystatus.status
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orderstatus)
    },
    //修改配送时间
    async putAdminOrderByDeliveryTime(ctx,next){
        ctx.checkBody('trade_no').notEmpty()
        //输入分钟数
        ctx.checkBody('deliveryTime').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body
        let order = await Orders.findOne({
            where:{
                trade_no : body.trade_no
            }
        })
        if(order==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此订单")
            return;
        }
        await Orders.update({
            deliveryTime : body.deliveryTime
        },{
            where:{
                trade_no : body.trade_no
            }
        })
        let orderDeliveryTime = await Orders.findOne({
            where:{
                trade_no : body.trade_no
            }
        })
        ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"配送时间大约为"+orderDeliveryTime.deliveryTime)
    },
    //修改类型
    async putAdminOrderByByzType(ctx,next){

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body

        await Orders.update({
            byzType : "eshop"
        },{where:{
            consigneeId : {
                $ne : null
            }
        }});
        await Orders.update({
            byzType : "deal"
        },{
            where:{
                consigneeId : null
            }
        })
        // logger.info(order);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //超级管理员查询全部
    async getAllAdminOrderByLimit(ctx, next){

        let result = [];
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
        let startTime = null;
        let endTime = null;
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
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        //页码
        let pageNumber = parseInt(ctx.query.pageNumber);
        //每页显示的大小
        let pageSize = parseInt(ctx.query.pageSize);
        let place = (pageNumber-1)*pageSize;
        //根据tenantId，查询当前时间的订单
        let orders = await Orders.findAll({
            where: {
                createdAt: {
                    $between: [startTime, endTime]
                }
            },
            order:[['createdAt','DESC']],
            offset : place,
            limit : pageSize
        })

        //循环不相同的订单号
        let order;
        let orderGoods;
        for (let k = 0; k < orders.length; k++) {
            totalNum = 0;//数量
            totalPrice = 0;//单价
            totalVipPrice = 0;//会员价
            //价格的数组
            foodJson = [];

            //根据consigneeId查询consigneeName
            let consignee = await Consignees.findOne({
                where: {
                    consigneeId: orders[k].consigneeId
                }
            });
            //根据创建时间和订单号查询所有记录
            orderGoods = await OrderGoods.findAll({
                where: {
                    trade_no: orders[k].trade_no
                }
            });

            for (var j = 0; j < orderGoods.length; j++) {
                //根据菜单号查询菜单
                let food = await Foods.findOne({
                    where: {
                        id: orderGoods[j].FoodId,
                    }
                });

                foodJson[j] = {};
                foodJson[j].id = food.id;
                foodJson[j].name = food.name;
                foodJson[j].price = food.price;
                foodJson[j].vipPrice = food.vipPrice;
                //  foodJson[k].consigneeName=(consigneesName.name==null?null:consigneesName.name);
                foodJson[j].num = orderGoods[j].num;
                foodJson[j].unit = orderGoods[j].unit;
                //总数量为每个循环的数量现价
                totalNum += orderGoods[j].num;
                //当前菜的总价格为菜品的价格*订单中购买的数量
                totalPrice += food.price * orderGoods[j].num;//原价
                //会员价为菜品的会员价*订单中购买的数量
                totalVipPrice += food.vipPrice * orderGoods[j].num;//会员价
            }

            result[k] = {};

            let table = await Tables.findById(orders[k].TableId);

            result[k].tableName = table.name;
            result[k].trade_no = orders[k].trade_no;
            result[k].info = orders[k].info;
            result[k].id = orders[k].id;
            result[k].byzType = orders[k].byzType;
            result[k].deliveryTime = orders[k].deliveryTime
            result[k].foods = foodJson;
            result[k].totalNum = totalNum;
            //result[k].totalPrice = Math.round(totalPrice * 100) / 100;
            result[k].dinersNum = orders[k].diners_num;
            result[k].status = orders[k].status;
            result[k].time = orders[k].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[k].phone = orders[k].phone;
            result[k].consigneeId =orders[k].consigneeId;
            result[k].consigneeId = orders[k].consigneeId;
            result[k].consigneeName = consignee == null ? null : consignee.name;
            //result[k].totalVipPrice = Math.round(totalVipPrice * 100) / 100;

            let refund_amount = 0;

            let paymentReq = await PaymentReqs.findOne({
                where: {
                    trade_no: orders[k].trade_no,
                    tenantId: ctx.query.tenantId
                }
            });

            if (paymentReq != null) {
                result[k].total_amount = paymentReq.total_amount;
                result[k].actual_amount = paymentReq.actual_amount;
                result[k].refund_amount = paymentReq.refund_amount;
                result[k].refund_reason = paymentReq.refund_reason;
                result[k].paymentMethod = paymentReq.paymentMethod;//支付方式
                refund_amount = paymentReq.refund_amount;
            } else {
                console.log("重要信息，未找到支付请求，订单号=========" + orders[k].trade_no);
            }

            let amount = await amoutManager.getTransAccountAmount
            (ctx.query.tenantId, orders[k].consigneeId, orders[k].trade_no, result[k].paymentMethod, refund_amount);

            //简单异常处理
            if (amount.totalAmount > 0) {
                result[k].totalPrice = amount.totalPrice;
                result[k].platformCouponFee = amount.platformCouponFee;
                result[k].merchantCouponFee = amount.merchantCouponFee;
                result[k].deliveryFee = amount.deliveryFee;
                result[k].refund_amount = refund_amount;
                result[k].platformAmount = amount.platformAmount;
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
                result[k].platformAmount = 0;
                result[k].merchantAmount = 0;
                result[k].consigneeAmount = 0;
                result[k].couponType = null;
                result[k].couponValue = null
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },


};