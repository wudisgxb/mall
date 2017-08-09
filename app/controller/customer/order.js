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
const DeliveryFees = db.models.DeliveryFees;
const DistanceAndPrices = db.models.DistanceAndPrices;
const PaymentReqs = db.models.PaymentReqs;
const webSocket = require('../../controller/socketManager/socketManager');
const infoPushManager = require('../../controller/infoPush/infoPush');
const tool = require('../../Tool/tool');
const ApiResult = require('../../db/mongo/ApiResult');
const vipManager = require('./vip');
const Promise = require('Promise');

module.exports = {
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
        for (i = 0; i < foodsJson.length; i++) {
            await OrderGoods.create({
                num: foodsJson[i].num,
                unit: foodsJson[i].unit,
                FoodId: foodsJson[i].FoodId,
                trade_no: trade_no,
                tenantId: body.tenantId,
            });
        }

        await Orders.create({
            phone: phone,
            TableId: table.id,
            info: body.remark,
            trade_no: trade_no,
            diners_num: body.dinersNum,
            status: 0,
            tenantId: body.tenantId,
        });

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
    },

    async saveUserEshopOrder (ctx, next) {
        ctx.checkBody('tableName').notEmpty();
        ctx.checkBody('remark').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();

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
                consigneeId: body.consigneeId
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
                consigneeId: body.consigneeId,
                phone: body.phoneNumber,
                tenantId: body.tenantId
            }
        })

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

        let i;
        for (i = 0; i < foodsJson.length; i++) {
            await OrderGoods.create({
                num: foodsJson[i].num,
                unit: foodsJson[i].unit,
                FoodId: foodsJson[i].FoodId,
                trade_no: trade_no,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId
            });
        }

        await Orders.create({
            phone: body.phoneNumber,
            TableId: table.id,
            info: body.remark,
            trade_no: trade_no,
            status: 0,
            tenantId: body.tenantId,
            consigneeId: body.consigneeId
        });

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
                tenantId: body.condition.tenantId
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
            for (var i =0;i<orderGoods.length;i++) {
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
                tenantId: ctx.query.tenantId
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
        let result = await this.getOrderDetailByTradeNo(trade_no);

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result);
    },

    async getUserEshopConsigneeOrder (ctx, next) {
        //ctx.checkQuery('consigneeId').notEmpty();
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
                //consigneeId: ctx.query.consigneeId,
            }
        })


        //循环不相同的订单号
        for (let k = 0; k < orders.length; k++) {
            //通过trade_no构造订单详情
            result = await this.getOrderDetailByTradeNo(orders[k].trade_no);
            results.push(result);
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, results)
    },

    //通过订单查询支付金额
    async getOrderPriceByOrder(order, firstDiscount, firstOrderDiscount) {
        let totalPrice = 0;
        let totalVipPrice = 0;
        let total_amount = 0;

        if (firstOrderDiscount == null) {
            firstDiscount = 0;
        }

        let orders = await OrderGoods.findAll({
            where:{
                trade_no:order.trade_no
            }
        })

        let food;
        for (var i = 0; i < orders.length; i++) {
            food = await Foods.findOne({
                where: {
                    id: orders[i].FoodId,
                    tenantId: orders[i].tenantId
                }
            })

            totalPrice += food.price * orders[i].num;//原价
            totalVipPrice += food.vipPrice * orders[i].num;//会员价
        }

        //判断vip
        if (order.phone != null) {
            var vips = await Vips.findAll({
                where: {
                    phone: order.phone,
                    tenantId: order.tenantId
                }
            })
            if (vips.length > 0) {
                total_amount = Math.round(totalVipPrice * 100) / 100
            } else {
                total_amount = Math.round(totalPrice * 100) / 100;
            }
        } else {
            total_amount = Math.round(totalPrice * 100) / 100;
        }

        //首单折扣
        if (firstDiscount != -1) {
            total_amount = total_amount * firstDiscount;
            console.log("firstDiscount=" + firstDiscount + " total_amount=" + total_amount);
        }

        //首杯半价
        total_amount = total_amount - firstOrderDiscount;

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
            let orders = await Orders.findAll({
                where: {
                    trade_no: trade_no,
                    tenantId: tenantId,
                }
            });
            let food;
            for (let i = 0; i < orders.length; i++) {
                food = await Foods.findAll({
                    where: {
                        id: orders[i].FoodId,
                        tenantId: orders[i].tenantId
                    }
                })

                //首杯半价(青豆家写死，后面完善)
                if (food[0].id == 26) {//草莓奶酪
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


            //首杯半价(青豆家写死，后面完善)
            if (food[0].id == 26) {//草莓奶酪
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
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
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

        for (let i = 0; i < orderGoods.length; i++) {
            food = await Foods.findAll({
                where: {
                    id: orderGoods[i].FoodId,
                    tenantId: orderGoods[i].tenantId
                }
            })
            foodJson[i] = {};
            foodJson[i].id = food[0].id;

            //首杯半价(青豆家写死，后面完善)
            if (food[0].id == 26) {//草莓奶酪
                firstFlag = 1;
                firstOrderDiscount = food[0].price * 0.5;
            }
            foodJson[i].name = food[0].name;
            foodJson[i].price = food[0].price;
            foodJson[i].vipPrice = food[0].vipPrice;
            foodJson[i].num = orderGoods[i].num;
            foodJson[i].unit = orderGoods[i].unit;
            totalNum += orderGoods[i].num;
            totalPrice += food[0].price * orderGoods[i].num;//原价
            totalVipPrice += food[0].vipPrice * orderGoods[i].num;//会员价
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
        console.log("firstFlag================" + firstFlag)
        if (firstFlag == 2) {
            console.log("firstOrderDiscount================" + firstOrderDiscount)
            result.firstOrderDiscount = firstOrderDiscount;
        }

        let table = await Tables.findById(order.TableId);
        result.tableName = table.name;
        result.foods = foodJson;
        result.totalNum = totalNum;
        result.totalPrice = Math.round(totalPrice * 100) / 100;
        result.isVip = false;

        result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
        result.time = order.createdAt.format("yyyy-MM-dd hh:mm:ss");
        result.info = order.info;
        result.status = order.status;
        result.diners_num = order.diners_num;
        result.tradeNo = order.trade_no;

        //满多少加会员
        let phone = order.phone;

        let isVip = await vipManager.isVip(phone, order.tenantId, result.totalPrice);
        console.log("vipFlag===" + isVip)
        result.isVip = isVip;

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
            result.deliveryFee = distanceAndPrice.deliveryFee;
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

        // 将 相同foodId 合并
        result.foods = result.foods.reduce((accu, curr) => {
            const exist = accu.find(e => e.id === curr.id)
            if (exist) {
                exist.num += curr.num
            } else {
                accu.push(curr)
            }

            return accu
        }, [])

        return result;
    },

}