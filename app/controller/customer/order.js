const db = require('../../db/mysql/index');
const sequelizex = require('../../lib/sequelizex.js');
const Orders = db.models.Orders;
const Foods = db.models.Foods;
const Tables = db.models.Tables;
const ShoppingCarts = db.models.ShoppingCarts;
const Vips = db.models.Vips;
const PaymentReqs = db.models.PaymentReqs;
const webSocket = require('../../controller/socketManager/socketManager');
const infoPushManager = require('../../controller/infoPush/infoPush');
const tool = require('../../Tool/tool');
const ApiResult = require('../../db/mongo/ApiResult')

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
        let trade_no = ctx.query.trade_no;
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

        for (let i = 0; i < orders.length; i++) {
            let food = await Foods.findAll({
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
        if (orders[0] != null) {
            result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
            result.time = orders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result.info = orders[0].info;
            result.status = orders[0].status;
            result.diners_num = orders[0].diners_num;
            //判断vip
            if (orders[0].phone != null) {
                let vips = await Vips.findAll({
                    where: {
                        phone: orders[0].phone,
                        tenantId: ctx.query.tenantId
                    }
                })
                if (vips.length > 0) {
                    result.discount = Math.round((result.totalPrice - result.totalVipPrice) * 100) / 100;
                    delete result.totalPrice;
                } else {
                    delete result.totalVipPrice;
                }
            } else {
                delete result.totalVipPrice;
            }
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

        //时间戳+4位随机数+tableId生成商家订单号
        let trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + table.id;
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

        //时间戳+4位随机数+tableId生成商家订单号
        let trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + table.id;
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

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

        //下单成功发送推送消息
        let date = new Date().format("hh:mm");
        let content = table.name + '已下单成功，请及时处理！ ' + date;
        infoPushManager.infoPush(content, body.tenantId);

        //通知管理台修改桌态
        let json = {"tableId": table.id, "status": 2};
        webSocket.sendSocket(JSON.stringify(json));
    },

    async updateUserEshopOrder (ctx, next) {
        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        ctx.checkBody('/condition/consigneeId', true).first().notEmpty();
        ctx.checkBody('/condition/tradeNo', true).first().notEmpty();
        ctx.checkBody('/food/foodId', true).first().notEmpty();
        ctx.checkBody('/food/foodCount', true).first().notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        const body = ctx.request.body;

        let orders = await Orders.findAll({
            where: {
                consigneeId: body.condition.consigneeId,
                trade_no: body.condition.tradeNo,
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
    },

    async deleteUserEshopOrder (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tradeNo').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let orders = await Orders.findAll({
            where: {
                consigneeId: ctx.query.consigneeId,
                trade_no: ctx.query.tradeNo,
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
        let trade_no = ctx.query.trade_no;
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

        for (let i = 0; i < orders.length; i++) {
            let food = await Foods.findAll({
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
        if (orders[0] != null) {
            result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
            result.time = orders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result.info = orders[0].info;
            result.status = orders[0].status;
            result.diners_num = orders[0].diners_num;
            //判断vip
            if (orders[0].phone != null) {
                let vips = await Vips.findAll({
                    where: {
                        phone: orders[0].phone,
                        tenantId: ctx.query.tenantId
                    }
                })
                if (vips.length > 0) {
                    result.discount = Math.round((result.totalPrice - result.totalVipPrice) * 100) / 100;
                    delete result.totalPrice;
                } else {
                    delete result.totalVipPrice;
                }
            } else {
                delete result.totalVipPrice;
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },
}