const ApiError = require('../../db/mongo/ApiError');
const ApiResult = require('../../db/mongo/ApiResult');
const logger = require('koa-log4').getLogger('AddressController');
const db = require('../../db/mysql/index');
const co = require('co')
const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
var Foods = db.models.Foods;
var PaymentReqs = db.models.PaymentReqs;
var Tables = db.models.Tables;
let Consignees = db.models.Consignees;
let Merchants = db.models.Merchants;
let TenantConfigs = db.models.TenantConfigs;
const amoutManager = require('../amount/amountManager');

module.exports = {

    async getAdminOrderByTradeNo(ctx, next){
        ctx.checkQuery('tradeNo').notBlank();
        // ctx.checkQuery('tenantId').notEmpty();
        let result = [];
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }


        let orders = [];

        orders = await Orders.findAll({
            where: {
                // tenantId: ctx.query.tenantId,
                trade_no : ctx.query.tradeNo
            }
        })
        // console.log(orders)


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

                foodJson[j] = {};
                foodJson[j].id = orderGoods[j].id;
                foodJson[j].name = orderGoods[j].goodsName;
                foodJson[j].price = orderGoods[j].price;
                foodJson[j].vipPrice = orderGoods[j].vipPrice;
                //  foodJson[k].consigneeName=(consigneesName.name==null?null:consigneesName.name);
                foodJson[j].num = orderGoods[j].num;
                foodJson[j].unit = orderGoods[j].unit;
                //总数量为每个循环的数量现价
                totalNum += orderGoods[j].num;
                //当前菜的总价格为菜品的价格*订单中购买的数量
                totalPrice += orderGoods[j].price * orderGoods[j].num;//原价
                //会员价为菜品的会员价*订单中购买的数量
                totalVipPrice += orderGoods[j].vipPrice * orderGoods[j].num;//会员价
            }

            result[k] = {};

            let table = await Tables.findById(orders[k].TableId);

            result[k].tableName = table==null?"":table.name;
            result[k].trade_no = orders[k].trade_no;
            result[k].info = orders[k].info;
            result[k].id = orders[k].id;
            result[k].bizType = orders[k].bizType;
            result[k].deliveryTime = orders[k].deliveryTime
            result[k].payTime = orders[k].payTime;
            result[k].acceptTime = orders[k].acceptTime
            result[k].receiveTime = orders[k].receiveTime
            result[k].foods = foodJson;
            result[k].totalNum = totalNum;
            //result[k].totalPrice = Math.round(totalPrice * 100) / 100;
            result[k].dinersNum = orders[k].diners_num;
            result[k].status = orders[k].status;
            result[k].time = orders[k].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[k].phone = orders[k].phone;
            result[k].consigneeId = orders[k].consigneeId;
            result[k].tenantId = orders[k].consigneeId;
            result[k].consigneeName = consignee == null ? null : consignee.name;
            //result[k].totalVipPrice = Math.round(totalVipPrice * 100) / 100;

            let refund_amount = 0;

            let paymentReq = await PaymentReqs.findOne({
                where: {
                    trade_no: orders[k].trade_no,
                    // tenantId: ctx.query.tenantId
                }
            });

            // console.log("111111111111111111111111111111111111"+paymentReq.id)

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

            let tenantconfig = await TenantConfigs.findOne({
                where:{
                    tenantId : orders[k].tenantId
                }
            })
            // console.log(222222222222222222)
            if(tenantconfig.isProfitRate){
                let getProfitRate = await amoutManager.getProfitRate(orders[k].tenantId,orders[k].trade_no)
                // console.log(1111111111111111)
                // console.log(getProfitRate.totalPrices)
                if(getProfitRate.totalPrices > 0){
                    // console.log(getProfitRate.totalPrices)
                    // console.log(333333333333333)
                    result[k].totalPrice = getProfitRate.totalPrices;
                    result[k].platformCouponFee = getProfitRate.terracePrice;
                    result[k].merchantCouponFee = getProfitRate.merchantTotalPrice;
                    console.log(getProfitRate.terracePrice)
                }

            }else{
                let amount = await amoutManager.getTransAccountAmount(orders[k].tenantId, orders[k].consigneeId, orders[k].trade_no, result[k].paymentMethod, refund_amount);
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

        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)

    },
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

    //下面有相同功能的代码了
    async getAdminOrder(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        let result = [];
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
        let startTime = null;
        let endTime = null;
        if (ctx.query.startTime == null) {
            startTime = '2000-05-14T06:12:22.000Z'
        } else {
            startTime = new Date(ctx.query.startTime);
        }
        if (ctx.query.endTime == null) {
            endTime = '2100-05-14T06:12:22.000Z'
        } else {
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
        let place = (pageNumber - 1) * pageSize;
        //根据tenantId，查询当前时间的订单
        let orders = [];
        if(ctx.query.status!=null){
            console.log(222222222222222222)
            if (ctx.query.pageNumber == null && ctx.query.pageSize == null) {
                orders = await Orders.findAll({
                    where: {
                        tenantId: ctx.query.tenantId,
                        createdAt: {
                            $between: [startTime, endTime]
                        },
                        status : ctx.query.status
                    },
                    order: [['createdAt', 'DESC']]
                })
            } else {
                orders = await Orders.findAll({
                    where: {
                        tenantId: ctx.query.tenantId,
                        status : ctx.query.status,
                        createdAt: {
                            $between: [startTime, endTime]
                        },
                    },
                    order: [['createdAt', 'DESC']],
                    offset: place,
                    limit: pageSize
                })
            }
        }else{
            if (ctx.query.pageNumber == null && ctx.query.pageSize == null) {
                orders = await Orders.findAll({
                    where: {
                        tenantId: ctx.query.tenantId,
                        createdAt: {
                            $between: [startTime, endTime]
                        }
                    },
                    order: [['createdAt', 'DESC']],
                })
            } else {
                orders = await Orders.findAll({
                    where: {
                        tenantId: ctx.query.tenantId
                    },
                    order: [['createdAt', 'DESC']],
                    offset: place,
                    limit: pageSize
                })

            }
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

                foodJson[j] = {};
                foodJson[j].id = orderGoods[j].id;
                foodJson[j].name = orderGoods[j].goodsName;
                foodJson[j].price = orderGoods[j].price;
                foodJson[j].vipPrice = orderGoods[j].vipPrice;
                //  foodJson[k].consigneeName=(consigneesName.name==null?null:consigneesName.name);
                foodJson[j].num = orderGoods[j].num;
                foodJson[j].unit = orderGoods[j].unit;
                //总数量为每个循环的数量现价
                totalNum += orderGoods[j].num;
                //当前菜的总价格为菜品的价格*订单中购买的数量
                totalPrice += orderGoods[j].price * orderGoods[j].num;//原价
                //会员价为菜品的会员价*订单中购买的数量
                totalVipPrice += orderGoods[j].vipPrice * orderGoods[j].num;//会员价
            }

            result[k] = {};

            let table = await Tables.findById(orders[k].TableId);

            result[k].tableName = table==null?"":table.name;
            result[k].trade_no = orders[k].trade_no;
            result[k].info = orders[k].info;
            result[k].id = orders[k].id;
            result[k].bizType = orders[k].bizType;
            result[k].deliveryTime = orders[k].deliveryTime
            result[k].payTime = orders[k].payTime;
            result[k].acceptTime = orders[k].acceptTime
            result[k].receiveTime = orders[k].receiveTime
            result[k].foods = foodJson;
            result[k].totalNum = totalNum;
            //result[k].totalPrice = Math.round(totalPrice * 100) / 100;
            result[k].dinersNum = orders[k].diners_num;
            result[k].status = orders[k].status;
            result[k].time = orders[k].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[k].phone = orders[k].phone;
            result[k].consigneeId = orders[k].consigneeId;
            result[k].tenantId = orders[k].consigneeId;
            result[k].consigneeName = consignee == null ? null : consignee.name;
            //result[k].totalVipPrice = Math.round(totalVipPrice * 100) / 100;

            let refund_amount = 0;

            let paymentReq = await PaymentReqs.findOne({
                where: {
                    trade_no: orders[k].trade_no,
                    tenantId: ctx.query.tenantId
                }
            });

            // console.log("111111111111111111111111111111111111"+paymentReq.id)

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

            let tenantconfig = await TenantConfigs.findOne({
                where:{
                    tenantId : ctx.query.tenantId
                }
            })

            if(tenantconfig.isProfitRate){
                let getProfitRate = await amoutManager.getProfitRate(ctx.query.tenantId,orders[k].trade_no)
                if(getProfitRate.totalPrices > 0){
                    result[k].totalPrice = getProfitRate.totalPrices;
                    result[k].platformCouponFee = getProfitRate.terracePrice;
                    result[k].merchantCouponFee = getProfitRate.merchantTotalPrice;
                    result[k].constPrice = getProfitRate.saleGoodsTotalPrices;
                }

            }else{
                let amount = await amoutManager.getTransAccountAmount(ctx.query.tenantId, orders[k].consigneeId, orders[k].trade_no, result[k].paymentMethod, refund_amount);
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
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },

    async getAdminGoodsOrder(ctx, next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('status').notEmpty()
        let result = [];
        let foodJson = [];
        let totalNums = 0;
        let totalPrices = 0;
        let totalVipPrices = 0;
        let startTime = null;
        let endTime = null;
        if (ctx.query.startTime == null) {
            startTime = '2000-05-14T06:12:22.000Z'
        } else {
            startTime = new Date(ctx.query.startTime);
        }
        if (ctx.query.endTime == null) {
            endTime = '2100-05-14T06:12:22.000Z'
        } else {
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
        let place = (pageNumber - 1) * pageSize;
        //根据tenantId，查询当前时间的订单
        let orders = [];
        if(ctx.query.status!=null){
            if (ctx.query.pageNumber == null && ctx.query.pageSize == null) {
                orders = await Orders.findAll({
                    where: {
                        tenantId: ctx.query.tenantId,
                        createdAt: {
                            $between: [startTime, endTime]
                        },
                        status : ctx.query.status
                    }
                })
            } else {
                orders = await Orders.findAll({
                    where: {
                        tenantId: ctx.query.tenantId,
                        status : ctx.query.status,
                        createdAt: {
                            $between: [startTime, endTime]
                        },
                    },
                    order: [['createdAt', 'DESC']],
                    offset: place,
                    limit: pageSize
                })
            }
        }else{
            if (ctx.query.pageNumber == null && ctx.query.pageSize == null) {
                orders = await Orders.findAll({
                    where: {
                        tenantId: ctx.query.tenantId,
                        createdAt: {
                            $between: [startTime, endTime]
                        }
                    }
                })
            } else {
                orders = await Orders.findAll({
                    where: {
                        tenantId: ctx.query.tenantId
                    },
                    order: [['createdAt', 'DESC']],
                    offset: place,
                    limit: pageSize
                })
            }
        }

        //循环不相同的订单号
        let order;
        let orderGoods;
        for (let k = 0; k < orders.length; k++) {
            let totalNum = 0;//数量
            let totalPrice = 0;//单价
            let discounts = 0;
            let reimbursePrice = 0

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
                foodJson[j] = {};
                //总数量为每个循环的数量现价
                totalNum += orderGoods[j].num;
                //当前菜的总价格为菜品的价格*订单中购买的数量
                totalPrice += orderGoods[j].price * orderGoods[j].num;//原价

            }
            let amount = await amoutManager.getTransAccountAmount()


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
    async getAdminOrderByCount(ctx, next){

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let orderOfCount
        if (ctx.query.tenantId != null && ctx.query.tenantId != "") {
            orderOfCount = await Orders.count({
                where: {
                    tenantId: ctx.query.tenantId
                }
            })
        } else {
            orderOfCount = await Orders.count({})
        }
        if (orderOfCount == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有当前所有信息")
            return;
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, orderOfCount)
    },
    //修改订单状态
    async updateAdminOrderByStatus(ctx, next){
        ctx.checkBody('trade_no').notEmpty();
        ctx.checkBody('status').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body
        let order = await Orders.findOne({
            where: {
                trade_no: body.trade_no
            }
        });
        // logger.info(order);
        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此记录");
            return;
        }

        if (body.status == 3) {
            await Orders.update({
                status: body.status,
                acceptTime: new Date()
            }, {
                where: {
                    trade_no: body.trade_no
                }
            })

        }
        if (body.status == 4) {
            await Orders.update({
                status: body.status,
                receiveTime: new Date()
            }, {
                where: {
                    trade_no: body.trade_no
                }
            })
        }
        if (body.status == 2) {
            await Orders.update({
                status: body.status,
                payTime: new Date()
            }, {
                where: {
                    trade_no: body.trade_no
                }
            })
        }


        let orderBystatus = await Orders.findOne({
            where: {
                trade_no: body.trade_no
            }
        });
        let orderstatus = {
            status: orderBystatus.status
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, orderstatus)
    },


    //添加下单时间，骑手接单时间，商家收单时间
    async postAdminOrderTime(ctx, next){
        let order = await Orders.findAll({})
        for (let ord of order) {
            await Orders.update({
                payTime: ord.createdAt,
                acceptTime: ord.createdAt,
                receiveTime: ord.createdAt
            }, {
                where: {
                    trade_no: ord.trade_no,
                    id : {
                        $lte : 1244
                    }
                }
            })
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    //修改配送时间
    async updateAdminOrderByDeliveryTime(ctx, next){
        ctx.checkBody('trade_no').notEmpty()
        //输入分钟数
        ctx.checkBody('deliveryTime').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body
        let order = await Orders.findOne({
            where: {
                trade_no: body.trade_no
            }
        })
        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此订单")
            return;
        }
        await Orders.update({
            deliveryTime: body.deliveryTime
        }, {
            where: {
                trade_no: body.trade_no
            }
        })
        let orderDeliveryTime = await Orders.findOne({
            where: {
                trade_no: body.trade_no
            }
        })
        ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "配送时间大约为" + orderDeliveryTime.deliveryTime)
    },
    //修改类型
    async updateAdminOrderByBizType(ctx, next){

        let ordergoods = await OrderGoods.findAll({})
        // console.log(ordergoods.length)
        for (let i = 0; i < ordergoods.length; i++) {
            if (ordergoods[i].FoodId != null) {
                let food = await Foods.findOne({
                    where: {
                        id: ordergoods[i].FoodId
                    }
                })
                await OrderGoods.update({
                    goodsName: food.name,
                    price: food.price,
                    vipPrice: food.vipPrice
                }, {
                    where: {
                        id: ordergoods[i].id
                    }
                })

            }
        }


        // await Orders.update({
        //     bizType : "eshop"
        // },{where:{
        //     consigneeId : {
        //         $ne : null
        //     }
        // }});
        // await Orders.update({
        //     bizType : "deal"
        // },{
        //     where:{
        //         consigneeId : null
        //     }
        // })
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
        if (ctx.query.startTime == null) {
            startTime = '2000-05-14T06:12:22.000Z'
        } else {
            startTime = new Date(ctx.query.startTime);
        }
        if (ctx.query.endTime == null) {
            endTime = '2100-05-14T06:12:22.000Z'
        } else {
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
        let place = (pageNumber - 1) * pageSize;
        //根据tenantId，查询当前时间的订单
        let jsonOrderWhere={}
        if(ctx.query.tenantId != "" && ctx.query.tenantId != null){
            jsonOrderWhere={
                tenantId : ctx.query.tenantId,
                createdAt: {
                    $between: [startTime, endTime]
                }
            }
        }else if(ctx.query.tenantId == "" || ctx.query.tenantId == null){
            jsonOrderWhere={
                createdAt: {
                    $between: [startTime, endTime]
                }
            }
        }
        let orders = await Orders.findAll({
            where: jsonOrderWhere,
            order: [['createdAt', 'DESC']],
            offset: place,
            limit: pageSize
        })


        //循环不相同的订单号
        let order;
        let orderGoods;
        for (let k = 0; k < orders.length; k++) {
            // console.log(orders[k].trade_no)
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
            let merchant = await Merchants.findOne({
                where:{
                    tenantId : orders[k].tenantId
                }
            })
            //根据创建时间和订单号查询所有记录
            orderGoods = await OrderGoods.findAll({
                where: {
                    trade_no: orders[k].trade_no
                }
            });

            for (var j = 0; j < orderGoods.length; j++) {
                //根据菜单号查询菜单
                foodJson[j] = {};
                foodJson[j].id = orderGoods[j].FoodId;
                foodJson[j].name = orderGoods[j].goodsName;
                foodJson[j].price = orderGoods[j].price;
                foodJson[j].vipPrice = orderGoods[j].vipPrice;
                //  foodJson[k].consigneeName=(consigneesName.name==null?null:consigneesName.name);
                foodJson[j].num = orderGoods[j].num;
                foodJson[j].unit = orderGoods[j].unit;
                //总数量为每个循环的数量现价
                totalNum += orderGoods[j].num;
                //当前菜的总价格为菜品的价格*订单中购买的数量
                totalPrice += orderGoods[j].price * orderGoods[j].num;//原价
                //会员价为菜品的会员价*订单中购买的数量
                totalVipPrice += orderGoods[j].vipPrice * orderGoods[j].num;//会员价

            }
            // console.log(totalPrice)
            result[k] = {};

            let table = await Tables.findById(orders[k].TableId);

            result[k].tableName = table.name;
            result[k].trade_no = orders[k].trade_no;
            result[k].info = orders[k].info;
            result[k].id = orders[k].id;
            result[k].bizType = orders[k].bizType;
            result[k].deliveryTime = orders[k].deliveryTime
            result[k].foods = foodJson;
            result[k].totalNum = totalNum;
            //result[k].totalPrice = Math.round(totalPrice * 100) / 100;
            result[k].dinersNum = orders[k].diners_num;
            result[k].status = orders[k].status;
            result[k].time = orders[k].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[k].phone = orders[k].phone;
            result[k].consigneeId = orders[k].consigneeId;
            result[k].tenantId = orders[k].tenantId;
            result[k].consigneeName = consignee == null ? null : consignee.name;
            result[k].tenantName = merchant == null ? null : merchant.name;
            //result[k].totalVipPrice = Math.round(totalVipPrice * 100) / 100;
            let refund_amount = 0;
            let paymentReq = await PaymentReqs.findOne({
                where: {
                    trade_no: orders[k].trade_no,
                    tenantId: orders[k].tenantId
                },
                paranoid: false
            });
            // console.log(orders[k].tenantId)
            // console.log("111111111111111111111111111111111"+paymentReq.trade_no)
            if (paymentReq != null) {
                result[k].total_amount = paymentReq.total_amount;
                result[k].actual_amount = paymentReq.actual_amount;
                result[k].refund_amount = paymentReq.refund_amount;
                result[k].refund_reason = paymentReq.refund_reason;
                result[k].paymentMethod = paymentReq.paymentMethod;//支付方式
                refund_amount = paymentReq.refund_amount;
            } else if(paymentReq == null) {
                console.log("重要信息，未找到支付请求，订单号=========" + orders[k].trade_no);
            }

            let amount = await amoutManager.getTransAccountAmount(orders[k].tenantId, orders[k].consigneeId, orders[k].trade_no, result[k].paymentMethod, refund_amount);
            // console.log(totalPrice)
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

    async postAdminOrderFoodName(ctx, next){
        let ordergoods = await OrderGoods.findAll({})
        let orderg = []
        for (let i = 0; i < ordergoods.length; i++) {
            if (ordergoods[i].FoodId == null) {
                let foods = await Foods.findAll({
                    where: {
                        tenantId: ordergoods[i].tenantId
                    }
                })

                let a = Math.ceil(Math.random() * (foods.length - 1))

                let foodId = foods[a].id

                orderg.push(
                    OrderGoods.update({
                        FoodId: foodId
                    }, {
                        where: {
                            id: ordergoods[i].id,
                            FoodId: null
                        }
                    })
                )
            }
        }
        await orderg
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
        // let ordergoods = await OrderGoods.findAll({})
        // let taske=[]
        // // console.log(ordergoods.length)
        // let newDate = new Date().getTime()
        // for(let i =0;i<ordergoods.length;i++){
        //     if(ordergoods[i].FoodId==null){
        //         continue;
        //     }
        //     let food = await Foods.findOne({
        //         where:{
        //             id : ordergoods[i].FoodId
        //         },
        //         attributes:["name"]
        //     })
        //     console.log(food.name)
        //     await OrderGoods.update({
        //         FoodName :food.name
        //     },{
        //         where:{
        //             id :ordergoods[i].id
        //         }
        //     })
        // }
        // let endDate = new Date().getTime()
        // ctx.body = new ApiResult(ApiResult.Result.SUCCESS,endDate-newDate)
    }
};
