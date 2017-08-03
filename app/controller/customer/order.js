const db = require('../../db/mysql/index');
const sequelizex = require('../../lib/sequelizex.js');
const Orders = db.models.Orders;
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

            let isVip = await vipManager.isVip(phone, orders[0].tenantId, result.totalPrice);
            result.isVip = isVip;

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
                result.couponValue = coupon.value;
                result.couponKey = coupon.couponKey;
            }

            //首单折扣，-1表示不折扣，根据手机号和租户id
            result.firstDiscount = await this.getFirstDiscount(phone, ctx.query.tenantId);


            result.totalPrice = Math.round(result.totalPrice * 100) / 100;
            result.totalVipPrice = Math.round(result.totalVipPrice * 100) / 100;
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

        let phone = body.phoneNumber;
        let trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + table.id;
        if (orders.length > 0) {
            orders.map(async function (e) {
                e.trade_no = trade_no;
                e.phone = phone;
                await e.save();
            })
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

        // //下单订单号绑定优惠券，支付回调去修改优惠券使用状态
        // if (body.couponKey != null) {
        //     let coupon = await Coupons.findOne({
        //         where: {
        //             couponKey: body.couponKey,
        //             tenantId: body.tenantId,
        //             phone: body.phoneNumber,
        //             status: 0,
        //         }
        //     })
        //
        //     if (coupon != null) {
        //         coupon.trade_no = trade_no;
        //         await coupon.save();
        //     }
        // }

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

        let trade_no = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000) + table.id;
        if (orders.length > 0) {
            orders.map(async function (e) {
                e.trade_no = trade_no;
                await e.save();
            })
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

        //配送费绑定订单号
        if (body.deliveryFeeId != null && body.deliveryFeeId != "") {
            await DeliveryFees.create({
                deliveryFeeId: body.deliveryFeeId,
                tenantId: body.tenantId,
                trade_no: trade_no
            })
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

        //暂时只删除，不支持编辑，预留代码后面有需要再改
        if (body.food.foodCount > 0) {
            orders[0].num = body.food.foodCount;
            await orders[0].save();
        } else {
            orders.map(async function (e) {
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

            let isVip = await vipManager.isVip(phone, ctx.query.tenantId, result.totalPrice);
            console.log("111111111111111111111111===" + isVip)
            result.isVip = isVip;

            //通过订单号获取优惠券
            let coupon = await Coupons.findOne({
                where: {
                    trade_no: orders[0].trade_no,
                    phone: ctx.query.phoneNumber,
                    tenantId: ctx.query.tenantId,
                    // consigneeId: ctx.query.consigneeId,
                    // status: 0
                }
            })

            if (coupon != null) {
                result.couponType = coupon.couponType;
                result.couponValue = coupon.value;
                result.couponKey = coupon.couponKey;
            }

            //首单折扣，-1表示不折扣，根据手机号和租户id
            result.firstDiscount = await this.getFirstDiscount(phone, ctx.query.tenantId);

            result.totalPrice = Math.round(result.totalPrice * 100) / 100;
            result.totalVipPrice = Math.round(result.totalVipPrice * 100) / 100;

            //查询配送费
            let deliveryFee = await DeliveryFees.findOne({
                where: {
                    trade_no: orders[0].trade_no,
                    tenantId: ctx.query.tenantId,
                }
            })

            if (deliveryFee != null) {
                let distanceAndPrice = await DistanceAndPrices.findOne({
                    where: {
                        deliveryFeeId: deliveryFee.deliveryFeeId,
                        tenantId: ctx.query.tenantId,
                    }
                })
                result.deliveryFee = distanceAndPrice.deliveryFee;
            }
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
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
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


        let result = [];
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;

        let orders;
        //根据手机号查询代售点下所有订单
        let order = await Orders.findAll({
            where: {
                createdAt: {
                    $between: [startTime, endTime]
                },
                phone: ctx.query.phoneNumber,
                consigneeId: ctx.query.consigneeId,
            }
        })

        let tradeNoArray = [];//订单号
        for (var i = 0; i < order.length; i++) {
            if (!tradeNoArray.contains(order[i].trade_no)) {
                tradeNoArray.push(order[i].trade_no);
            }
        }
        //循环不相同的订单号
        for (let k = 0; k < tradeNoArray.length; k++) {
            totalNum = 0;//数量
            totalPrice = 0;//单价
            totalVipPrice = 0;//会员价
            //价格的数组
            foodJson = [];
            //根据订单号查询租户id
            let order = await Orders.findOne({
                where: {
                    createdAt: {
                        $between: [startTime, endTime]
                    },
                    trade_no: tradeNoArray[k]
                }
            })
            //根据tenantId查询租户名
            let merchant = await Merchants.findOne({
                where: {
                    tenantId: order.tenantId
                }
            })
            //根据创建时间和订单号查询所有记录
            orders = await Orders.findAll({
                where: {
                    createdAt: {
                        $between: [startTime, endTime]
                    },
                    trade_no: tradeNoArray[k]
                },
                order: [["createdAt", "DESC"]]
            })

            for (var j = 0; j < orders.length; j++) {
                //根据菜单号查询菜单
                let food = await Foods.findOne({
                    where: {
                        id: orders[j].FoodId,
                    }
                })

                foodJson[j] = {};
                foodJson[j].id = food.id;
                foodJson[j].name = food.name;
                foodJson[j].price = food.price;
                foodJson[j].vipPrice = food.vipPrice;
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
            result[k].totalPrice = Math.round(totalPrice * 100) / 100;
            result[k].dinersNum = orders[0].diners_num;
            result[k].paymentMethod = orders[0].paymentMethod;//支付方式
            result[k].status = orders[0].status;
            result[k].time = orders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[k].phone = orders[0].phone;
            result[k].tenantId = merchant.tenantId;
            result[k].merchantName = merchant.name;
            result[k].merchantIndustry = merchant.industry;
            result[k].totalVipPrice = Math.round(totalVipPrice * 100) / 100;

            let paymentReq = await PaymentReqs.findOne({
                where: {
                    trade_no: tradeNoArray[k],
                }
            });

            if (paymentReq != null) {
                result[k].total_amount = paymentReq.total_amount;
                result[k].actual_amount = paymentReq.actual_amount;
                result[k].refund_amount = paymentReq.refund_amount;
                result[k].refund_reason = paymentReq.refund_reason;
            }

        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)
    },

    //通过订单查询支付金额
    async getOrderPriceByOrder(orders, firstDiscount) {
        let totalPrice = 0;
        let totalVipPrice = 0;
        let total_amount = 0;

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
        if (orders[0].phone != null) {
            var vips = await Vips.findAll({
                where: {
                    phone: orders[0].phone,
                    tenantId: orders[0].tenantId
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

        //通过订单号获取优惠券
        let coupon = await Coupons.findOne({
            where: {
                trade_no: orders[0].trade_no,
                phone: orders[0].phone,
                tenantId: orders[0].tenantId,
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
                trade_no: orders[0].trade_no,
                tenantId: orders[0].tenantId,
            }
        })

        if (deliveryFee != null) {
            let distanceAndPrice = await DistanceAndPrices.findOne({
                where: {
                    deliveryFeeId: deliveryFee.deliveryFeeId,
                    tenantId: orders[0].tenantId,
                }
            })
            total_amount = parseFloat(total_amount) + parseFloat(distanceAndPrice.deliveryFee);
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

}