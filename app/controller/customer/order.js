const db = require('../../db/mysql/index');
const sequelizex = require('../../lib/sequelizex.js');
const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
const Foods = db.models.Foods;
const Consignees = db.models.Consignees;
const Tables = db.models.Tables;
const ShoppingCarts = db.models.ShoppingCarts;
const Vips = db.models.Vips;
const TenantConfigs = db.models.TenantConfigs;
const Merchants = db.models.Merchants;
const Coupons = db.models.Coupons;
const customer = require('../admin/customer/customer')
const DeliveryFees = db.models.DeliveryFees;
const DistanceAndPrices = db.models.DistanceAndPrices;
const PaymentReqs = db.models.PaymentReqs;
const webSocket = require('../../controller/socketManager/socketManager');
const promotionManager = require('./promotions');
const infoPushManager = require('../../controller/infoPush/infoPush');
const tool = require('../../Tool/tool');
const ApiResult = require('../../db/mongo/ApiResult');
const vipManager = require('./vip');
const Promise = require('Promise');

module.exports = {

    async onlinePayment(ctx, next){
        ctx.checkBody('tenantId').notBlank()
        ctx.checkBody('tableName').notBlank()
        ctx.checkBody('tradeNo').notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body

        let orders = await Orders.findOne({
            where:{
                tenantId : body.tenantId,
                trade_no : body.tradeNo,
            }
        })
        if(orders==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此订单信息")
            return
        }
        orders.isOnlinePayment = 1
        await orders.save()
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getOnlinePayment(ctx, next){
        ctx.checkQuery('tenantId').notBlank()
        ctx.checkQuery('tableName').notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let startTime
        if(ctx.query.startTime==null||ctx.query.startTime==""){
            startTime = new Date("2000-1-1")
        }
        let endTime
        if(ctx.query.endTime==null||ctx.query.endTime==""){
            endTime = new Date()
        }

        // let pageNumber = parseInt(ctx.query.pageNumber);
        //
        // if(pageNumber<1){
        //     pageNumber=1
        // }
        //
        // let pageSize = parseInt(ctx.query.pageSize);
        // if(pageSize<1){
        //     pageSize=1
        // }
        // let place = (pageNumber - 1) * pageSize;
        // let limitJson = {}
        // if(pageNumber!=null&&pageNumber!=""&&pageSize!=null&&pageSize!=""){
        //     limitJson = {
        //         offset: Number(place),
        //         limit: Number(pageSize)
        //     }
        // }
        try{
            let table = await Tables.findOne({
                where:{
                    tenantId : ctx.query.tenantId,
                    name : ctx.query.tableName,
                    createdAt:{
                        $gte : startTime,
                        $lt : endTime
                    }
                }
            })
            if(table==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此房间号")
                return
            }
            //查询所有线下支付的订单
            let orders = await Orders.findAll({
                where:{
                    tenantId : ctx.query.tenantId,
                    TableId : table.id,
                    isOnlinePayment : 1,
                    status : 1
                },
                // limitJson
            })
            if(orders.length==0){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此订单信息")
                return
            }

            for(let i = 0; i < orders.length; i++){
                let tradeNo = orders[i].trade_no
                let ordersGoods = await OrderGoods.findAll({
                    where:{
                        tenantId : ctx.query.tenantId,
                        trade_no : tradeNo
                    }
                })
                let totalPrice = 0
                for(let j = 0; j<ordersGoods.length; j++){
                    totalPrice = ordersGoods[j].num*ordersGoods[j].price
                }
                orders[i].dataValues.orderGoods = ordersGoods
                orders[i].dataValues.totalPrice = totalPrice
                console.log(orders[i].dataValues)


            }
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orders)

        }catch(e){
            ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,e)
            return
        }
    },

    async onlinePayment(ctx, next){
        ctx.checkBody('tenantId').notBlank()
        ctx.checkBody('tradeNo').notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body

        let orders = await Orders.findOne({
            where:{
                tenantId : body.tenantId,
                trade_no : body.tradeNo,
                isOnlinePayment : 1
            }
        })
        if(orders==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此订单信息")
            return
        }
        orders.status = 2
        await orders.save()
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getUserDealOrder (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        //获取tableId
        let table = await Tables.findOne({
            where: {
                tenantId: ctx.query.tenantId,
                name: ctx.query.tableName,
                consigneeId: null
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let tableId = table.id;
        let trade_no = ctx.query.tradeNo;
        let result;

        if (trade_no == undefined) {
            let order = await Orders.findOne({
                where: {
                    TableId: tableId,
                    $or: [{status: 0}, {status: 1}],
                    tenantId: ctx.query.tenantId,
                    consigneeId: null
                }
            })

            if (order != null) {
                trade_no = order.trade_no;
            } else {
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到订单');
                return;
            }
        }

        //通过trade_no构造订单详情
        try {
            result = await this.getOrderDetailByTradeNo(trade_no);
        } catch (e) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, e.message);
            return;
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },

    async saveUserDealOrder (ctx, next) {
        ctx.checkBody('tableName').notEmpty();
        ctx.checkBody('remark').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('dinersNum').notEmpty().isInt().toInt();
        ctx.checkBody('qrcodeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let body = ctx.request.body;

        //获取tableId
        let table = await Tables.findOne({
            where: {
                tenantId: body.tenantId,
                name: body.tableName,
                consigneeId: null
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        //从购物车获取
        let foodsJson = await ShoppingCarts.findAll({
            where: {
                TableId: table.id,
                tenantId: body.tenantId,
                consigneeId: null
            }
        })

        //取之前的订单号，获取请求参数用一个订单号，手机号也一样
        let order = await Orders.findOne({
            where: {
                TableId: table.id,
                tenantId: body.tenantId,
                $or: [{status: 0}, {status: 1}],
                consigneeId: null
            }
        })

        let phone = body.phoneNumber;
        let trade_no;
        if (order != null) {
            // orders.map(async function (e) {
            //     e.trade_no = trade_no;
            //     e.phone = phone;
            //     await e.save();
            // })
            trade_no = order.trade_no;
        } else {
            trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + table.id;
        }

        let i;

        let food;
        let tasks = [];
        let goodsPromotionJson = {};
        for (i = 0; i < foodsJson.length; i++) {
            food = await Foods.findOne({
                where: {
                    id: foodsJson[i].FoodId
                },
            });
            //获取活动价和单品限购,通过二维码ID
            goodsPromotionJson = await promotionManager.getGoodsPromotion(body.qrcodeId, foodsJson[i].FoodId, body.tenantId);
            if (goodsPromotionJson != null) {
                tasks.push(OrderGoods.create({
                    num: foodsJson[i].num,
                    unit: foodsJson[i].unit,
                    FoodId: foodsJson[i].FoodId,
                    goodsName: food.name,
                    price: food.price,
                    vipPrice: food.vipPrice,
                    activityPrice: goodsPromotionJson.activityPrice,
                    purchaseLimit: goodsPromotionJson.purchaseLimit,
                    trade_no: trade_no,
                    tenantId: body.tenantId,
                    constPrice : food.constPrice
                }));
            } else {
                tasks.push(OrderGoods.create({
                    num: foodsJson[i].num,
                    unit: foodsJson[i].unit,
                    FoodId: foodsJson[i].FoodId,
                    goodsName: food.name,
                    price: food.price,
                    vipPrice: food.vipPrice,
                    trade_no: trade_no,
                    tenantId: body.tenantId,
                    constPrice : food.constPrice
                }));
            }

        }
        await tasks;

        if (order == null) {
            let orderLimit = await promotionManager.getOrderLimit(body.qrcodeId, body.tenantId);

            //添加默認配送時間
            await Orders.create({
                phone: phone,
                TableId: table.id,
                info: body.remark,
                trade_no: trade_no,
                diners_num: body.dinersNum,
                status: 0,
                tenantId: body.tenantId,
                QRCodeTemplateId: body.qrcodeId,
                orderLimit: orderLimit,
                bizType: "deal",
                deliveryTime: "",
                payTime: new Date()
            });
        }

        //清空购物车
        await ShoppingCarts.destroy({
            where: {
                TableId: table.id,
                consigneeId: null,
                tenantId: body.tenantId
            }
        })

        //修改桌号状态
        table.name = table.name;
        table.status = 2;//已下单
        await table.save();

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

        //下单成功发送推送消息
        let date = new Date().format("hh:mm");
        let content = table.name + '已下单成功，请及时处理！ ' + date;
        infoPushManager.infoPush(content, body.tenantId);

        //通知管理台修改桌态
        let json = {"tableId": table.id, "status": 2};
        webSocket.sendSocket(JSON.stringify(json));
        //新增
        // let foodsNameNum = []
        // for(let j=0;j<foodsIdNum.length;j++){
        //     let foods = await Foods.findId(foodsIdNum[i])
        //     foodsNameNum.push(foods.name)
        // }

        //通知管理台发送消息
        // let jsonOrder = {
        //     "TableId": table.id,
        //     "status": 2,
        //     "phone" : phone,
        //     "FoodName" : foodsNameNum
        // };
        // webSocket.sendSocket(JSON.stringify(jsonOrder));
        //------
    },

    async saveUserEshopOrder (ctx, next) {
        ctx.checkBody('tableName').notEmpty();
        ctx.checkBody('remark').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('qrcodeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body;
        //获取tableId
        let table = await Tables.findOne({
            where: {
                tenantId: body.tenantId,
                name: body.tableName,
                consigneeId: body.consigneeId
            }
        })
        // console.log("桌号"+table)
        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        //从购物车获取
        let foodsJson = await ShoppingCarts.findAll({
            where: {
                TableId: table.id,
                consigneeId: body.consigneeId,
                phone: body.phoneNumber,
                tenantId: body.tenantId
            }
        })

        console.log("购物车" + JSON.stringify(foodsJson))

        //取之前的订单号，获取请求参数用一个订单号
        let order = await Orders.findOne({
            where: {
                TableId: table.id,
                tenantId: body.tenantId,
                phone: body.phoneNumber,
                $or: [{status: 0}, {status: 1}],
                consigneeId: body.consigneeId
            }
        })

        let trade_no;
        if (order != null) {
            // orders.map(async function (e) {
            //     e.trade_no = trade_no;
            //     await e.save();
            // })
            trade_no = order.trade_no;
        } else {
            trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + table.id;
        }

        let deliveryTime = "30分钟"
        if (body.deliveryFeeId != null && body.deliveryFeeId != "") {
            let distanceandpriceOne = await DistanceAndPrices.findOne({
                where: {
                    deliveryFeeId: body.deliveryFeeId
                }
            })
            deliveryTime = distanceandpriceOne.deliveryTime
        }

        if (body.deliveryFeeId != null && body.deliveryFeeId != "") {
            let distanceAndPrice = await DistanceAndPrices.findOne({
                where: {
                    deliveryFeeId: body.deliveryFeeId
                }
            })
            deliveryTime = distanceAndPrice.deliveryTime
        }

        // console.log(distanceandprice)
        let i;
        let food;
        let tasks = [];
        let goodsPromotionJson = {};
        for (i = 0; i < foodsJson.length; i++) {

            food = await Foods.findOne({
                where: {
                    id: foodsJson[i].FoodId
                },
            });
            goodsPromotionJson = await promotionManager.getGoodsPromotion(body.qrcodeId, foodsJson[i].FoodId, body.tenantId);

            if (goodsPromotionJson != null) {
                tasks.push(OrderGoods.create({
                    num: foodsJson[i].num,
                    unit: foodsJson[i].unit,
                    FoodId: foodsJson[i].FoodId,
                    goodsName: food.name,
                    trade_no: trade_no,
                    price: food.price,
                    vipPrice: food.vipPrice,
                    activityPrice: goodsPromotionJson.activityPrice,
                    purchaseLimit: goodsPromotionJson.purchaseLimit,
                    tenantId: body.tenantId,
                    consigneeId: body.consigneeId,
                    constPrice : food.constPrice
                }))
            } else {
                tasks.push(OrderGoods.create({
                    num: foodsJson[i].num,
                    unit: foodsJson[i].unit,
                    FoodId: foodsJson[i].FoodId,
                    goodsName: food.name,
                    trade_no: trade_no,
                    price: food.price,
                    vipPrice: food.vipPrice,
                    tenantId: body.tenantId,
                    consigneeId: body.consigneeId,
                    constPrice : food.constPrice
                }))
            }

        }
        await tasks;

        if (order == null) {
            let orderLimit = await promotionManager.getOrderLimit(body.qrcodeId, body.tenantId);

            await Orders.create({
                phone: body.phoneNumber,
                TableId: table.id,
                info: body.remark,
                trade_no: trade_no,
                status: 0,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
                QRCodeTemplateId: body.qrcodeId,
                orderLimit: orderLimit,
                bizType: "eshop",
                deliveryTime: deliveryTime,
                payTime: new Date()
            });
        }

        //清空购物车
        await ShoppingCarts.destroy({
            where: {
                TableId: table.id,
                consigneeId: body.consigneeId,
                phone: body.phoneNumber,
                tenantId: body.tenantId
            }
        })

        //下单订单号绑定优惠券，支付回调去修改优惠券使用状态
        if (body.couponKey != null) {
            let coupon = await Coupons.findOne({
                where: {
                    couponKey: body.couponKey,
                    tenantId: body.tenantId,
                    phone: body.phoneNumber,
                    status: 0,
                }
            })

            if (coupon != null) {
                coupon.trade_no = trade_no;
                await coupon.save();
            }
        }

        //配送费绑定订单号
        if (body.deliveryFeeId != null && body.deliveryFeeId != "") {
            await DeliveryFees.create({
                deliveryFeeId: body.deliveryFeeId,
                tenantId: body.tenantId,
                trade_no: trade_no
            })
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);

        let consignee = await Consignees.findOne({
            where: {
                consigneeId: body.consigneeId,
            }
        });

        //下单成功发送推送消息
        let date = new Date().format("hh:mm");
        let content = '代售商：' + consignee.name + ' ' + "桌名：" + table.name + ' 手机号' + body.phoneNumber + '已下单成功，请及时处理！ ' + date;
        infoPushManager.infoPush(content, body.tenantId);

        //通知管理台修改桌态
        let json = {"tableId": table.id, "status": 2};
        webSocket.sendSocket(JSON.stringify(json));
    },

    async updateUserEshopOrder (ctx, next) {
        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        ctx.checkBody('/condition/consigneeId', true).first().notEmpty();
        ctx.checkBody('/condition/tableName', true).first().notEmpty();
        ctx.checkBody('/condition/phoneNumber', true).first().notEmpty();
        ctx.checkBody('/food/foodId', true).first().notEmpty();
        ctx.checkBody('/food/foodCount', true).first().notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        const body = ctx.request.body;

        //获取tableId
        let table = await Tables.findOne({
            where: {
                tenantId: body.condition.tenantId,
                name: body.condition.tableName,
                consigneeId: body.condition.consigneeId
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let order = await Orders.findOne({
            where: {
                consigneeId: body.condition.consigneeId,
                TableId: table.id,
                phone: body.condition.phoneNumber,
                tenantId: body.condition.tenantId,
                $or: [{status: 0}, {status: 1}],
            }
        });

        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "订单不存在！")
            return;
        }

        let orderGoods = OrderGoods.findAll({
            where: {
                trade_no: order.trade_no,
                FoodId: body.food.foodId,
            }
        });

        if (orderGoods.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "订单食物不存在！")
            return;
        }

        //修改订单食物，第一条修改，其他相同的删除
        if (body.food.foodCount > 0) {
            for (var i = 0; i < orderGoods.length; i++) {
                if (i == 0) {
                    orderGoods[0].num = body.food.foodCount;
                    await orderGoods[0].save();
                } else {
                    await orderGoods[i].destroy();
                }
            }

        } else {
            orderGoods.map(async function (e) {
                await e.destroy();
            })
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

        let consignee = await Consignees.findOne({
            where: {
                consigneeId: body.condition.consigneeId,
            }
        });

        //修改订单发送推送消息
        let date = new Date().format("hh:mm");
        let content = '代售商：' + consignee.name + ' ' + "桌名：" + table.name + ' 手机号' + body.condition.phoneNumber + '修改订单成功，请及时处理！ ' + date;
        infoPushManager.infoPush(content, body.condition.tenantId);
    },

    async deleteUserEshopOrder (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        //获取tableId
        let table = await Tables.findOne({
            where: {
                tenantId: ctx.query.tenantId,
                name: ctx.query.tableName,
                consigneeId: ctx.query.consigneeId
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let order = await Orders.findOne({
            where: {
                consigneeId: ctx.query.consigneeId,
                TableId: table.id,
                phone: ctx.query.phoneNumber,
                tenantId: ctx.query.tenantId,
                $or: [{status: 0}, {status: 1}],
            }
        });

        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "订单食物不存在！无需删除！")
            return;
        }

        await order.destroy();

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getUserEshopOrder (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        //获取tableId
        let table = await Tables.findOne({
            where: {
                tenantId: ctx.query.tenantId,
                name: ctx.query.tableName,
                consigneeId: ctx.query.consigneeId
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let tableId = table.id;
        let trade_no = ctx.query.tradeNo;

        let order;

        if (trade_no == undefined) {
            order = await Orders.findOne({
                where: {
                    TableId: tableId,
                    $or: [{status: 0}, {status: 1}],
                    phone: ctx.query.phoneNumber,
                    tenantId: ctx.query.tenantId,
                    consigneeId: ctx.query.consigneeId
                }
            })

            if (order != null) {
                trade_no = order.trade_no;
            } else {
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到订单!');
                return;
            }
        }

        //通过orders构造订单详情
        //通过trade_no构造订单详情
        let result;
        try {
            result = await this.getOrderDetailByTradeNo(trade_no);
        } catch (e) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, e.message);
            return;
        }

        let ordergoods = await OrderGoods.findAll({
            where: {
                trade_no: trade_no
            }
        })
        let ArrayGoodsName = [];
        if (ordergoods.length > 0) {
            for (let i = 0; i < ordergoods.length; i++) {
                for (let j = 0; j < ordergoods[i].num; j++) {
                    ArrayGoodsName.push(ordergoods[i].goodsName)
                }
            }
        }
        let customerVips = await Vips.findAll({
            where: {
                phone: ctx.query.phoneNumber,
                tenantId: ctx.query.tenantId,
            }
        });
        let isVip = false
        if (customerVips.length > 0) {
            isVip = true
        }
        let customerJson = {
            tenantId: ctx.query.tenantId,
            phone: ctx.query.phoneNumber,
            status: 2,
            foodName: JSON.stringify(ArrayGoodsName),
            totalPrice: result.totalPrice,
            isVip: isVip
        }
        await customer.saveCustomer(customerJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result);
    },

    async getUserEshopConsigneeOrder (ctx, next) {
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();
        ctx.checkQuery('startTime').notEmpty();
        ctx.checkQuery('endTime').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let startTime = new Date(ctx.query.startTime);
        let endTime = new Date(ctx.query.endTime);

        let result = {};
        let results = [];

        //根据手机号查询代售点下所有订单
        let orders = await Orders.findAll({
            where: {
                createdAt: {
                    $between: [startTime, endTime]
                },
                phone: ctx.query.phoneNumber,
                // consigneeId: ctx.query.consigneeId,
            }
        })

        //循环不相同的订单号
        for (let k = 0; k < orders.length; k++) {
            //通过trade_no构造订单详情
            try {
                result = await this.getOrderDetailByTradeNo(orders[k].trade_no);
            } catch (e) {
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, e.message);
                return;
            }
            results.push(result);
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, results)
    },

    //通过订单查询支付金额
    async getOrderPriceByOrder(order, firstDiscount, firstOrderDiscount) {
        let totalPrice = 0;
        let totalVipPrice = 0;
        let total_amount = 0;

        //是否折扣和优惠券共享
        let isShared = await promotionManager.getOrderAndGoodsPromotionIsShared(order.trade_no);

        if (firstOrderDiscount == null) {
            firstOrderDiscount = 0;
        }

        let orderGoods = await OrderGoods.findAll({
            where: {
                trade_no: order.trade_no
            }
        })

        let foodIds = [];
        for (let k = 0; k < orderGoods.length; k++) {
            if (!foodIds.contains(orderGoods[k].FoodId)) {
                foodIds.push(orderGoods[k].FoodId)
            }
        }

        let goodsDiscount = 0;
        let totalGoodsDiscount = 0;
        for (var i = 0; i < foodIds.length; i++) {
            orderGoods = await OrderGoods.findAll({
                where: {
                    trade_no: order.trade_no,
                    FoodId: foodIds[i]
                }
            })

            var foodNum = 0;
            for (var j = 0; j < orderGoods.length; j++) {
                foodNum += orderGoods[j].num;
                totalPrice += orderGoods[0].price * orderGoods[j].num;//原价
                totalVipPrice += orderGoods[0].vipPrice * orderGoods[j].num;//会员价
            }
            //根据订单号和商品id查询商品折扣优惠
            goodsDiscount = await promotionManager.getGoodsDiscount(order.trade_no, foodIds[i], foodNum);
            totalGoodsDiscount += goodsDiscount;
        }

        // let food;
        // for (var i = 0; i < orders.length; i++) {
        //     food = await Foods.findOne({
        //         where: {
        //             id: orders[i].FoodId,
        //             tenantId: orders[i].tenantId
        //         }
        //     })
        //
        //     totalPrice += food.price * orders[i].num;//原价
        //     totalVipPrice += food.vipPrice * orders[i].num;//会员价
        // }

        //判断vip
        let isVip = false;
        if (order.phone != null) {
            isVip = await vipManager.isVipWithoutPrice(order.phone, order.tenantId)
            if (isVip == true) {
                total_amount = Math.round(totalVipPrice * 100) / 100
                totalGoodsDiscount = 0;//会员不享受活动价
            } else {
                total_amount = Math.round((totalPrice - totalGoodsDiscount) * 100) / 100;
            }
        } else {
            total_amount = Math.round((totalPrice - totalGoodsDiscount) * 100) / 100;
        }


        //首单折扣 ,
        if (firstDiscount != -1) {
            total_amount = total_amount * firstDiscount;
            console.log("firstDiscount=" + firstDiscount + " total_amount=" + total_amount);
        }

        //首杯半价
        total_amount = total_amount - firstOrderDiscount;


        if (isShared == true || totalGoodsDiscount == 0) {
            //通过订单号获取优惠券
            let coupon = await Coupons.findOne({
                where: {
                    trade_no: order.trade_no,
                    phone: order.phone,
                    tenantId: order.tenantId,
                    status: 0
                }
            })

            if (coupon != null) {
                switch (coupon.couponType) {
                    case 'amount':
                        total_amount = ((total_amount - coupon.value) <= 0) ? 0.01 : (total_amount - coupon.value);
                        break;
                    case 'discount':
                        total_amount = total_amount * coupon.value;
                        break;
                    case 'reduce':
                        if (total_amount >= coupon.value.split('-')[0]) {
                            total_amount = total_amount - coupon.value.split('-')[1];
                        }
                        break;
                    default:
                        total_amount = total_amount;
                }
            }
        }

        //查询配送费
        let deliveryFee = await DeliveryFees.findOne({
            where: {
                trade_no: order.trade_no,
                tenantId: order.tenantId,
            }
        })

        if (deliveryFee != null) {
            let distanceAndPrice = await DistanceAndPrices.findOne({
                where: {
                    deliveryFeeId: deliveryFee.deliveryFeeId,
                    tenantId: order.tenantId,
                }
            })
            total_amount = parseFloat(total_amount) + parseFloat(distanceAndPrice.deliveryFee);
        }

        if (total_amount <= 0) {
            total_amount = 0.01;
        }

        return Math.round(total_amount * 100) / 100;
    },

    //获取首单折扣
    async getFirstDiscount(phone, tenantId) {
        let tenantConfig = await TenantConfigs.findOne({
            where: {
                tenantId: tenantId,
            }
        })

        if (tenantConfig.firstDiscount == -1) {
            return -1;
        } else {
            let paymentReqs = await PaymentReqs.findAll({
                where: {
                    phoneNumber: phone,
                    tenantId: tenantId,
                    isFinish: 1
                }
            })

            if (paymentReqs.length == 0) {
                return tenantConfig.firstDiscount;
            } else {
                if (paymentReqs)
                    return -1;
            }
        }
    },

    //通过订单号获取首杯折扣(暂时写死)
    async getFirstOrderDiscountByTradeNo(trade_no, tenantId) {
        let firstOrderDiscount = 0;
        let paymentReq = await PaymentReqs.findOne({
            where: {
                trade_no: trade_no,
                tenantId: tenantId,
                firstOrder: true,
            }
        })

        if (paymentReq == null) {
            return firstOrderDiscount;
        } else {
            let orders = await OrderGoods.findAll({
                where: {
                    trade_no: trade_no,
                    tenantId: tenantId,
                }
            });
            let food;

            for (let i = 0; i < orders.length; i++) {
                console.log(orders[i].FoodId)
                food = await Foods.findAll({
                    where: {
                        id: orders[i].FoodId,
                        tenantId: orders[i].tenantId
                    }
                })
                //首杯半价(青豆家写死，后面完善)
                if (food[0].id == 21) {//草莓奶酪
                    firstOrderDiscount = food[0].price * 0.5;
                    return Math.round(firstOrderDiscount * 100) / 100;
                }
            }
            return firstOrderDiscount;
        }
    },

    //通过订单号获取首单折扣
    async getFirstDiscountByTradeNo(trade_no, tenantId) {
        let tenantConfig = await TenantConfigs.findOne({
            where: {
                tenantId: tenantId,
            }
        })

        if (tenantConfig.firstDiscount == -1) {
            return -1;
        } else {
            let paymentReq = await PaymentReqs.findOne({
                where: {
                    trade_no: trade_no,
                    tenantId: tenantId
                }
            })

            if (paymentReq == null) {
                return -1;
            } else {
                return paymentReq.firstDiscount;
            }
        }
    },

    //通过订单号获取首单折扣
    async getFirstOrderDiscount(order) {
        //首杯半价标记(青豆家写死，后面完善)
        let firstFlag = 0;
        let firstOrderDiscount = 0;


        //获取订单foods
        let orderGoods = await OrderGoods.findAll({
            where: {
                trade_no: order.trade_no
            }
        })

        if (orderGoods.length == 0) {
            return 0;
        }

        let food;
        for (let i = 0; i < orderGoods.length; i++) {
            food = await Foods.findAll({
                where: {
                    id: orderGoods[i].FoodId,
                    tenantId: orderGoods[i].tenantId
                }
            })

            console.log("orderGoods[i].FoodId===" + orderGoods[i].FoodId);
            console.log("orderGoods[i].tenantId===" + orderGoods[i].tenantId);
            //首杯半价(青豆家写死，后面完善)
            if (food[0].id == 21) {//草莓奶酪
                firstFlag = 1;
                firstOrderDiscount = food[0].price * 0.5;
            }
        }
        //首杯半价(青豆家写死，后面完善)
        if (firstFlag == 1) {
            //判断是否首杯，2个条件判断
            let paymentReqs = await PaymentReqs.findAll({
                where: {
                    trade_no: order.trade_no,
                    firstOrder: true,
                    tenantId: order.tenantId,
                    consigneeId: order.consigneeId,
                }
            });

            if (paymentReqs.length > 0) {
                firstFlag = 2;
            } else {
                paymentReqs = await PaymentReqs.findAll({
                    where: {
                        isFinish: true,
                        isInvalid: false,
                        phoneNumber: order.phone,
                        tenantId: order.tenantId,
                        consigneeId: order.consigneeId,
                    }
                });

                if (paymentReqs.length == 0) {
                    firstFlag = 2;
                }
            }
        }

        //首杯半价(青豆家写死，后面完善)
        console.log("firstFlag33================" + firstFlag)
        if (firstFlag == 2) {
            console.log("firstOrderDiscount33================" + firstOrderDiscount)
            return firstOrderDiscount;
        } else {
            return 0;
        }
    },

    //通过tradeNo构造订单详情
    async getOrderDetailByTradeNo(trade_no) {
        let foodArr = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
        let goodsDiscountJson = 0; //商品折扣
        let totalGoodsDiscount = 0;//商品总折扣
        let food;
        let result = {};

        //首杯半价标记(青豆家写死，后面完善)
        let firstFlag = 0;
        let firstOrderDiscount = 0;

        //获取newOrder表内容
        let order = await Orders.findOne({
            where: {
                trade_no: trade_no
            }
        })

        if (order == null) {
            throw new Error('订单不存在!');
        }

        //获取订单foods
        let orderGoods = await OrderGoods.findAll({
            where: {
                trade_no: trade_no
            }
        })

        if (orderGoods.length == 0) {
            throw new Error('订单不存在!!');
        }

        let foodIds = [];
        for (let k = 0; k < orderGoods.length; k++) {
            if (!foodIds.contains(orderGoods[k].FoodId)) {
                foodIds.push(orderGoods[k].FoodId)
            }
        }

        for (var i = 0; i < foodIds.length; i++) {
            orderGoods = await OrderGoods.findAll({
                where: {
                    trade_no: trade_no,
                    FoodId: foodIds[i]
                }
            })
            foodArr[i] = {};
            foodArr[i].id = orderGoods[0].FoodId;

            foodArr[i].name = orderGoods[0].goodsName;
            foodArr[i].price = orderGoods[0].price;
            foodArr[i].vipPrice = orderGoods[0].vipPrice;
            foodArr[i].unit = orderGoods[0].unit;
            foodArr[i].num = 0;

            for (var j = 0; j < orderGoods.length; j++) {
                console.log("orderGoods[j].num======" + orderGoods[j].num)
                foodArr[i].num += orderGoods[j].num;
                totalNum += orderGoods[j].num;
                totalPrice += orderGoods[0].price * orderGoods[j].num;//原价
                totalVipPrice += orderGoods[0].vipPrice * orderGoods[j].num;//会员价
            }

            //根据订单号和商品id查询商品折扣优惠和数量
            goodsDiscountJson = await promotionManager.getGoodsDiscountAndPurchaseLimit(trade_no, foodIds[i], foodArr[i].num);
            totalGoodsDiscount += goodsDiscountJson.goodsDiscount;
            foodArr[i].goodsDiscountJson = goodsDiscountJson;
        }

        // for (let i = 0; i < orderGoods.length; i++) {
        //     // food = await Foods.findAll({
        //     //     where: {
        //     //         id: orderGoods[i].FoodId,
        //     //         tenantId: orderGoods[i].tenantId
        //     //     }
        //     // })
        //     foodJson[i] = {};
        //     foodJson[i].id = orderGoods[i].FoodId;
        //
        //     //首杯半价(青豆家写死，后面完善)
        //     if (orderGoods[i].FoodId == 21) {//草莓奶酪
        //         firstFlag = 1;
        //         firstOrderDiscount = orderGoods[i].price * 0.5;
        //     }
        //     foodJson[i].name = orderGoods[i].goodsName;
        //     foodJson[i].price = orderGoods[i].price;
        //     foodJson[i].vipPrice = orderGoods[i].vipPrice;
        //     foodJson[i].num = orderGoods[i].num;
        //     foodJson[i].unit = orderGoods[i].unit;
        //     totalNum += orderGoods[i].num;
        //     totalPrice += orderGoods[0].price * orderGoods[i].num;//原价
        //     totalVipPrice += orderGoods[0].vipPrice * orderGoods[i].num;//会员价
        //
        //     //根据订单号和商品id查询商品折扣优惠
        //     goodsDiscount += await promotionManager.getGoodsDiscount(trade_no, orderGoods[i].FoodId);
        // }


        //首杯半价(青豆家写死，后面完善)
        if (firstFlag == 1) {
            //判断是否首杯，2个条件判断
            let paymentReqs = await PaymentReqs.findAll({
                where: {
                    trade_no: order.trade_no,
                    firstOrder: true,
                    tenantId: order.tenantId,
                    consigneeId: order.consigneeId,
                }
            });

            if (paymentReqs.length > 0) {
                firstFlag = 2;
            } else {
                paymentReqs = await PaymentReqs.findAll({
                    where: {
                        isFinish: true,
                        isInvalid: false,
                        phoneNumber: order.phone,
                        tenantId: order.tenantId,
                        consigneeId: order.consigneeId,
                    }
                });

                if (paymentReqs.length == 0) {
                    firstFlag = 2;
                }
            }
        }

        //首杯半价(青豆家写死，后面完善)
        console.log("firstFlag================" + firstFlag)
        if (firstFlag == 2) {
            console.log("firstOrderDiscount================" + firstOrderDiscount)
            result.firstOrderDiscount = firstOrderDiscount;
        }

        let table = await Tables.findById(order.TableId);
        result.tableName = table.name;
        result.totalNum = totalNum;
        result.promptText = order.tenantId=="333397591b10c8b584f5c01cdee5a49b"?"友情提示:5分钟内没收到货物请致电前台联系(前台电话号码:025-84449229)":"";
        result.totalPrice = Math.round(totalPrice * 100) / 100;
        result.isVip = false;

        result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
        result.time = order.createdAt.format("yyyy-MM-dd hh:mm:ss");
        result.info = order.info;
        result.deliveryTime = order.deliveryTime
        result.bizType = order.bizType
        result.status = order.status;
        result.diners_num = order.diners_num;
        result.tradeNo = order.trade_no;

        //满多少加会员
        let phone = order.phone;

        let isVip = await vipManager.isVip(phone, order.tenantId, result.totalPrice);
        console.log("vipFlag===" + isVip)
        result.isVip = isVip;

        if (isVip == true) {
            //返回商品总折扣
            result.totalGoodsDiscount = 0;
            for (var i = 0; i < foodArr.length; i++) {
                delete foodArr[i].goodsDiscountJson;
            }
            result.foods = foodArr;
        } else {
            //返回商品总折扣,分开显示（参考饿了吗）
            result.totalGoodsDiscount = totalGoodsDiscount;
            let tmpFoodArr = [];
            let tmpFoodJson = {};
            if (totalGoodsDiscount > 0) {
                for (var i = 0; i < foodArr.length; i++) {
                    if (foodArr[i].goodsDiscountJson.goodsDiscount > 0) {
                        if (foodArr[i].num <= foodArr[i].goodsDiscountJson.goodsNum) {
                            foodArr[i].price = foodArr[i].price - foodArr[i].goodsDiscountJson.goodsDiscount;
                            tmpFoodArr.push(foodArr[i]);
                        } else {
                            tmpFoodJson = new Object();
                            tmpFoodJson = tool.deepCopy(foodArr[i]);
                            console.log("foodArr[i].price ==" + foodArr[i].price);
                            console.log("foodArr[i].goodsDiscountJson.goodsDiscount ==" + foodArr[i].goodsDiscountJson.goodsDiscount);
                            tmpFoodJson.activityPrice = foodArr[i].price - foodArr[i].goodsDiscountJson.goodsDiscount;
                            tmpFoodJson.num = foodArr[i].goodsDiscountJson.goodsNum;
                            tmpFoodArr.push(tmpFoodJson);

                            tmpFoodJson = new Object();
                            tmpFoodJson = tool.deepCopy(foodArr[i]);
                            tmpFoodJson.price = foodArr[i].price;
                            tmpFoodJson.num = foodArr[i].num - foodArr[i].goodsDiscountJson.goodsNum;
                            tmpFoodArr.push(tmpFoodJson);
                        }
                    } else {
                        tmpFoodArr.push(foodArr[i])
                    }
                }
                result.foods = tmpFoodArr;
            } else {
                result.foods = foodArr;
            }
        }

        //通过订单号获取优惠券
        let coupon = await Coupons.findOne({
            where: {
                trade_no: order.trade_no,
                phone: phone,
                tenantId: order.tenantId,
            }
        })

        if (coupon != null) {
            result.couponType = coupon.couponType;
            result.couponValue = coupon.value;
            result.couponKey = coupon.couponKey;
        }

        //根据tenantId查询租户名
        let merchant = await Merchants.findOne({
            where: {
                tenantId: order.tenantId
            }
        })
        result.tenantId = order.tenantId;
        result.merchantName = merchant.name;
        result.merchantIndustry = merchant.industry;
        result.merchantPhone = merchant.phone

        result.consigneeId = order.consigneeId;

        //首单折扣，-1表示不折扣，根据手机号和租户id
        result.firstDiscount = await this.getFirstDiscount(phone, order.tenantId);

        result.totalPrice = Math.round(result.totalPrice * 100) / 100;
        result.totalVipPrice = Math.round(result.totalVipPrice * 100) / 100;

        //查询配送费
        let deliveryFee = await DeliveryFees.findOne({
            where: {
                trade_no: order.trade_no,
                tenantId: order.tenantId,
            }
        })

        if (deliveryFee != null) {
            let distanceAndPrice = await DistanceAndPrices.findOne({
                where: {
                    deliveryFeeId: deliveryFee.deliveryFeeId,
                    tenantId: order.tenantId,
                }
            })
            let minusDeliveryFee = distanceAndPrice.deliveryFee
            // if(totalPrice>distanceAndPrice.startPrice&&distanceAndPrice.isMinusDeliveryFee!="-1"){
            //     minusDeliveryFee = 0
            // }
            result.deliveryFee = minusDeliveryFee;
        }

        //支付后查询用户实际支付金额
        let paymentReq = await PaymentReqs.findOne({
            where: {
                trade_no: order.trade_no,
                tenantId: order.tenantId,
                consigneeId: order.consigneeId,
            }
        });


        if (paymentReq != null) {
            result.actualAmount = paymentReq.actual_amount;
        }

        //是否能用优惠券
        //是否折扣和优惠券共享
        //couponFlag表示是否能用优惠券
        let isShared = await promotionManager.getOrderAndGoodsPromotionIsShared(trade_no);
        if (isShared == true) {
            result.canUseCoupon = true;
        } else {
            if (totalGoodsDiscount > 0) {
                result.canUseCoupon = false;
            } else {
                result.canUseCoupon = true;
            }
        }

        // // 将 相同foodId 合并
        // result.foods = result.foods.reduce((accu, curr) => {
        //     const exist = accu.find(e => e.id === curr.id)
        //     if (exist) {
        //         exist.num += curr.num
        //     } else {
        //         accu.push(curr)
        //     }
        //
        //     return accu
        // }, [])

        return result;
    },

}