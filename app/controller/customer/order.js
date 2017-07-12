const db = require('../../db/mysql/index');
const sequelizex = require('../../lib/sequelizex.js');
const Orders = db.models.Orders;
const Foods = db.models.Foods;
const Consignees = db.models.Consignees;
const Tables = db.models.Tables;
const ShoppingCarts = db.models.ShoppingCarts;
const Vips = db.models.Vips;
const TenantConfigs = db.models.TenantConfigs;
const Coupons = db.models.Coupons;
const PaymentReqs = db.models.PaymentReqs;
const webSocket = require('../../controller/socketManager/socketManager');
const infoPushManager = require('../../controller/infoPush/infoPush');
const tool = require('../../Tool/tool');
const ApiResult = require('../../db/mongo/ApiResult');
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
        let result = {};
        let orders;

        if (trade_no != undefined) {
            orders = await Orders.findAll({
                where: {
                    TableId: tableId,
                    trade_no: trade_no,
                    tenantId: ctx.query.tenantId,
                    consigneeId: null
                }
            })
        } else {
            orders = await Orders.findAll({
                where: {
                    TableId: tableId,
                    $or: [{status: 0}, {status: 1}],
                    tenantId: ctx.query.tenantId,
                    consigneeId: null
                }
            })
        }
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
        let food;
        for (let i = 0; i < orders.length; i++) {
            food = await Foods.findAll({
                where: {
                    id: orders[i].FoodId,
                    tenantId: ctx.query.tenantId
                }
            })
            foodJson[i] = {};
            foodJson[i].id = food[0].id;
            foodJson[i].name = food[0].name;
            foodJson[i].price = food[0].price;
            foodJson[i].vipPrice = food[0].vipPrice;
            foodJson[i].num = orders[i].num;
            foodJson[i].unit = orders[i].unit;
            totalNum += orders[i].num;
            totalPrice += food[0].price * orders[i].num;//原价
            totalVipPrice += food[0].vipPrice * orders[i].num;//会员价
        }
        result.tableName = table.name;
        result.foods = foodJson;
        result.totalNum = totalNum;
        result.totalPrice = Math.round(totalPrice * 100) / 100;
        result.isVip = false;
        if (orders[0] != null) {
            result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
            result.time = orders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result.info = orders[0].info;
            result.status = orders[0].status;
            result.diners_num = orders[0].diners_num;
            result.tradeNo = orders[0].trade_no;


            //满多少加会员
            let phone = orders[0].phone;

            let vip = await Vips.findOne({
                where: {
                    phone: phone,
                    tenantId: orders[0].tenantId
                }
            })

            //根据订单算原始总价格
            let tenantConfig = await TenantConfigs.findOne({
                where: {
                    tenantId: orders[0].tenantId
                }
            });

            if (vip == null) {
                if (result.totalPrice >= tenantConfig.vipFee) {
                    await Vips.create({
                        phone: phone,
                        vipLevel: 0,
                        vipName: "匿名",
                        tenantId: orders[0].tenantId
                        // todo: ok?
                    });
                    result.isVip = true;
                }
            }

            //通过订单号获取优惠券
            let coupon = await Coupons.findOne({
                where: {
                    trade_no: orders[0].trade_no,
                    phone: phone,
                    tenantId: orders[0].tenantId,
                    status: 0
                }
            })

            if (coupon != null) {
                result.couponType = coupon.couponType;
                result.couponvalue = coupon.value;

                if (coupon.couponType == '金额') {
                    result.totalPrice = ((result.totalPrice - coupon.value) <= 0) ? 0.01 : (result.totalPrice - coupon.value);
                    result.totalVipPrice = ((result.totalVipPrice - coupon.value) <= 0) ? 0.01 : (result.totalVipPrice - coupon.value);
                } else {
                    result.totalPrice = result.totalPrice * coupon.value;
                    result.totalVipPrice = result.totalVipPrice * coupon.value;
                }
            }

            // //判断vip
            // if (orders[0].phone != null) {
            //     let vips = await Vips.findAll({
            //         where: {
            //             phone: orders[0].phone,
            //             tenantId: ctx.query.tenantId
            //         }
            //     })
            //     if (vips.length > 0) {
            //         result.discount = Math.round((result.totalPrice - result.totalVipPrice) * 100) / 100;
            //         delete result.totalPrice;
            //     } else {
            //         delete result.totalVipPrice;
            //     }
            // } else {
            //     delete result.totalVipPrice;
            // }
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
        let orders = await Orders.findAll({
            where: {
                TableId: table.id,
                tenantId: body.tenantId,
                $or: [{status: 0}, {status: 1}],
                consigneeId: null
            }
        })

        let trade_no;
        let phone;
        if (orders.length > 0) {
            trade_no = orders[0].trade_no;
            phone = orders[0].phone;
        } else {
            //时间戳+4位随机数+tableId生成商家订单号
            trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + table.id;
            phone = body.phoneNumber;
        }

        let i;
        for (i = 0; i < foodsJson.length; i++) {
            await Orders.create({
                num: foodsJson[i].num,
                unit: foodsJson[i].unit,
                FoodId: foodsJson[i].FoodId,
                phone: phone,
                TableId: table.id,
                info: body.remark,
                trade_no: trade_no,
                diners_num: body.dinersNum,
                status: 0,
                tenantId: body.tenantId,
                // consignee: ctx.query.consignee || ""
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

        //查询是否有临时支付请求，有的话使其失效
        let paymentReqs = await PaymentReqs.findAll({
            where: {
                tableId: table.id,
                isFinish: false,
                isInvalid: false,
                tenantId: body.tenantId
            }
        });

        for (i = 0; i < paymentReqs.length; i++) {
            paymentReqs[i].isInvalid = true;
            paymentReqs[i].save();
        }

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
        let orders = await Orders.findAll({
            where: {
                TableId: table.id,
                tenantId: body.tenantId,
                phone: body.phoneNumber,
                $or: [{status: 0}, {status: 1}],
                consigneeId: body.consigneeId
            }
        })

        let trade_no;
        if (orders.length > 0) {
            trade_no = orders[0].trade_no;
        } else {
            //时间戳+4位随机数+tableId生成商家订单号
            trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + table.id;
        }

        let i;
        for (i = 0; i < foodsJson.length; i++) {
            await Orders.create({
                num: foodsJson[i].num,
                unit: foodsJson[i].unit,
                FoodId: foodsJson[i].FoodId,
                phone: body.phoneNumber,
                TableId: table.id,
                info: body.remark,
                trade_no: trade_no,
                // diners_num: body.dinersNum,
                status: 0,
                tenantId: body.tenantId,
                consigneeId: body.consigneeId
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

        //此状态对代售无效，无需修改
        // //修改桌号状态
        // table.name = table.name;
        // table.status = 2;//已下单
        // await table.save();

        //查询是否有临时支付请求，有的话使其失效
        let paymentReqs = await PaymentReqs.findAll({
            where: {
                tableId: table.id,
                isFinish: false,
                isInvalid: false,
                tenantId: body.tenantId
            }
        });

        for (i = 0; i < paymentReqs.length; i++) {
            paymentReqs[i].isInvalid = true;
            paymentReqs[i].save();
        }

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

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

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

        let orders = await Orders.findAll({
            where: {
                consigneeId: body.condition.consigneeId,
                TableId: table.id,
                phone: body.condition.phoneNumber,
                FoodId: body.food.foodId,
                tenantId: body.condition.tenantId
            }
        });

        if (orders.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "订单食物不存在！")
            return;
        }

        if (body.food.foodCount > 0) {
            orders[0].num = body.food.foodCount;
            await orders[0].save();
        } else {
            await orders[0].destroy();
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

        let consignee = await Consignees.findOne({
            where: {
                consigneeId: body.consigneeId,
            }
        });

        //修改订单发送推送消息
        let date = new Date().format("hh:mm");
        let content = '代售商：' + consignee.name + ' ' + "桌名：" + table.name + ' 手机号' + body.phoneNumber + '修改订单成功，请及时处理！ ' + date;
        infoPushManager.infoPush(content, body.tenantId);
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

        let orders = await Orders.findAll({
            where: {
                consigneeId: ctx.query.consigneeId,
                TableId: table.id,
                phone: ctx.query.phoneNumber,
                tenantId: ctx.query.tenantId
            }
        });

        if (orders.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "订单食物不存在！无需删除！")
            return;
        }

        orders.forEach(async function (e) {
            await e.destroy();
        })

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
        let result = {};
        let orders;

        if (trade_no != undefined) {
            orders = await Orders.findAll({
                where: {
                    TableId: tableId,
                    trade_no: trade_no,
                    phone: ctx.query.phoneNumber,
                    tenantId: ctx.query.tenantId,
                    consigneeId: ctx.query.consigneeId
                }
            })
        } else {
            orders = await Orders.findAll({
                where: {
                    TableId: tableId,
                    $or: [{status: 0}, {status: 1}],
                    phone: ctx.query.phoneNumber,
                    tenantId: ctx.query.tenantId,
                    consigneeId: ctx.query.consigneeId
                }
            })
        }
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
        let food;
        for (let i = 0; i < orders.length; i++) {
            food = await Foods.findAll({
                where: {
                    id: orders[i].FoodId,
                    tenantId: ctx.query.tenantId
                }
            })
            foodJson[i] = {};
            foodJson[i].id = food[0].id;
            foodJson[i].name = food[0].name;
            foodJson[i].price = food[0].price;
            foodJson[i].vipPrice = food[0].vipPrice;
            foodJson[i].num = orders[i].num;
            foodJson[i].unit = orders[i].unit;
            totalNum += orders[i].num;
            totalPrice += food[0].price * orders[i].num;//原价
            totalVipPrice += food[0].vipPrice * orders[i].num;//会员价
        }
        result.tableName = table.name;
        result.foods = foodJson;
        result.totalNum = totalNum;
        result.totalPrice = Math.round(totalPrice * 100) / 100;
        result.isVip = false;
        if (orders[0] != null) {
            result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
            result.time = orders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result.info = orders[0].info;
            result.status = orders[0].status;
            result.diners_num = orders[0].diners_num;
            result.tradeNo = orders[0].trade_no;


            //满多少加会员
            let phone = ctx.query.phoneNumber;

            let vip = await Vips.findOne({
                where: {
                    phone: phone,
                    tenantId: orders[0].tenantId
                }
            })

            //根据订单算原始总价格
            let tenantConfig = await TenantConfigs.findOne({
                where: {
                    tenantId: orders[0].tenantId
                }
            });

            if (vip == null) {
                if (result.totalPrice >= tenantConfig.vipFee) {
                    await Vips.create({
                        phone: phone,
                        vipLevel: 0,
                        vipName: "匿名",
                        tenantId: orders[0].tenantId
                        // todo: ok?
                    });
                    result.isVip = true;
                }
            }

            //通过订单号获取优惠券
            let coupon = await Coupons.findOne({
                where: {
                    trade_no: orders[0].trade_no,
                    phone: ctx.query.phoneNumber,
                    tenantId: ctx.query.tenantId,
                   // consigneeId: ctx.query.consigneeId,
                    status: 0
                }
            })

            if (coupon != null) {
                result.couponType = coupon.couponType;
                result.couponvalue = coupon.value;

                if (coupon.couponType == '金额') {
                    result.totalPrice = ((result.totalPrice - coupon.value) <= 0) ? 0.01 : (result.totalPrice - coupon.value);
                    result.totalVipPrice = ((result.totalVipPrice - coupon.value) <= 0) ? 0.01 : (result.totalVipPrice - coupon.value);
                } else {
                    result.totalPrice = result.totalPrice * coupon.value;
                    result.totalVipPrice = result.totalVipPrice * coupon.value;
                }
            }
            // //判断vip
            // if (orders[0].phone != null) {
            //     let vips = await Vips.findAll({
            //         where: {
            //             phone: orders[0].phone,
            //             tenantId: ctx.query.tenantId
            //         }
            //     })
            //     if (vips.length > 0) {
            //         result.discount = Math.round((result.totalPrice - result.totalVipPrice) * 100) / 100;
            //         delete result.totalPrice;
            //     } else {
            //         delete result.totalVipPrice;
            //     }
            // } else {
            //     delete result.totalVipPrice;
            // }
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },

    async getOrderPriceByTradeNo(tradeNo, tenantId) {
        let orders = await Orders.findAll({
            where: {
                trade_no: tradeNo,
                tenantId: tenantId
            },
            paranoid: false
        })

        let totalPrice = 0;
        let food;
        for (let i = 0; i < orders.length; i++) {
            food = await Foods.findOne({
                where: {
                    id: orders[i].FoodId,
                    tenantId: tenantId
                }
            })
            totalPrice += food.price * orders[i].num;//原价
        }
        return Promise.resolve(totalPrice);
    }
}