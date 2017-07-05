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


module.exports = {

    async getAdminOrder (ctx, next) {
        let result = [];
        let foodJson = [];
        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;
        let startTime = null;
        let endTime = null;
        if (ctx.query.startTime != null) {
            startTime = new Date(ctx.query.startTime);
            console.log("startTime:" + startTime);
        } else {
            startTime = '2000-05-14T06:12:22.000Z';
        }
        if (ctx.query.endTime != null) {
            endTime = new Date(ctx.query.endTime);
        } else {
            endTime = '2200-05-14T06:12:22.000Z';
        }

        let isAlreadyPaid = ctx.query.isAlreadyPaid;
        let orders;
        if (isAlreadyPaid == undefined) {
            orders = await Orders.findAll({
                where: {
                    createdAt: {
                        $between: [startTime, endTime]
                    },
                    tenantId: ctx.query.tenantId
                },
                attributes: {
                    exclude: ['updatedAt']
                }
            })

        } else {
            if (isAlreadyPaid == true) {
                orders = await Orders.findAll({
                    where: {
                        createdAt: {
                            $between: [startTime, endTime]
                        },
                        tenantId: ctx.query.tenantId,
                        status: 2
                    },
                    attributes: {
                        exclude: ['updatedAt']
                    }
                })
            } else {
                orders = await Orders.findAll({
                    where: {
                        createdAt: {
                            $between: [startTime, endTime]
                        },
                        tenantId: ctx.query.tenantId,
                        $or: [{status: 0}, {status: 1}],
                    },
                    attributes: {
                        exclude: ['updatedAt']
                    }
                })
            }
        }

        let tradeNoArray = [];
        for (var i = 0; i < orders.length; i++) {
            if (!tradeNoArray.contains(orders[i].own_trade_no)) {
                tradeNoArray.push(orders[i].own_trade_no);
            }
        }

        //再次查询
        for (i = 0; i < tradeNoArray.length; i++) {
            totalNum = 0;
            totalPrice = 0;
            totalVipPrice = 0;
            foodJson = [];
            orders = await Orders.findAll({
                where: {
                    createdAt: {
                        $between: [startTime, endTime]
                    },
                    own_trade_no: tradeNoArray[i]
                },
                attributes: {
                    exclude: ['updatedAt']
                }
            })
            for (let j = 0; j < orders.length; j++) {
                let food = await Foods.findAll({
                    where: {
                        id: orders[j].FoodId,
                    }
                })
                foodJson[j] = {};
                foodJson[j].id = food[0].id;
                foodJson[j].name = food[0].name;
                foodJson[j].price = food[0].price;
                foodJson[j].vipPrice = food[0].vipPrice;
                foodJson[j].num = orders[j].num;
                foodJson[j].unit = orders[j].unit;
                totalNum += orders[j].num;
                totalPrice += food[0].price * orders[j].num;//原价
                totalVipPrice += food[0].vipPrice * orders[j].num;//会员价
            }
            result[i] = {};
            //result[i].tableId = orders[0].tableId;
            let table = await Tables.findById(orders[0].TableId);
            result[i].tableName = table.name;
            result[i].own_trade_no = tradeNoArray[i];
            result[i].info = orders[0].info;
            result[i].foods = foodJson;
            result[i].totalNum = totalNum;
            result[i].totalPrice = Math.round(totalPrice * 100) / 100;
            result[i].dinersNum = orders[0].diners_num;
            result[i].paymentMethod = orders[0].paymentMethod;//支付方式
            result[i].status = orders[0].status;
            result[i].time = orders[0].createdAt.format("yyyy-MM-dd hh:mm:ss");
            result[i].phone = orders[0].phone;
            result[i].consignee = orders[0].consignee;
            result[i].totalVipPrice = Math.round(totalVipPrice * 100) / 100;

            //根据订单号找退款信息
            let tmp = await Orders.findAll({
                where: {
                    own_trade_no: tradeNoArray[i],
                    tenantId: ctx.query.tenantId,
                }
            });
            if (tmp[0].trade_no != null && tmp[0].trade_no != '') {
                console.log("OOOOOOOOOOOOOOOOOsss||" + tmp[0].trade_no);
                console.log("tenantId = " + ctx.query.tenantId);
                let paymentReqs = await PaymentReqs.findAll({
                    where: {
                        trade_no: tmp[0].trade_no,
                        tenantId: ctx.query.tenantId,
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
            if (orders[0].phone != null) {
                let vips = await Vips.findAll({
                    where: {
                        phone: orders[0].phone,
                        tenantId: ctx.query.tenantId
                    }
                })
                if (vips.length > 0) {
                    delete result[i].totalPrice;
                } else {
                    delete result[i].totalVipPrice;
                }
            } else {
                delete result[i].totalVipPrice;
            }
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async modifyTableStatus (tableId, tableStatus) {
        let table = await Tables.findById(tableId);
        table.status = tableStatus;
        await  table.save();
        if (tableStatus == 0) {
            let paymentReqs = PaymentReqs.findAll({
                where: {
                    tableId: tableId,
                    isFinish: false,
                    isInvalid: false
                }
            });
            if (paymentReqs.length > 0) {
                for (let i = 0; i < paymentReqs.length; i++) {
                    paymentReqs[i].isInvalid = true;
                    await paymentReqs[i].save();
                }
            }
        } else {

        }
        return Promise.resolve(null);
    },

    async updateAdminOrderByEditId (ctx, next) {
        ctx.checkParams('id').notEmpty().isInt().toInt();
        ctx.checkBody('FoodId').notEmpty();
        ctx.checkBody('addNum').notEmpty().isInt();
        ctx.checkBody('tableUser').notEmpty();

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        let id = ctx.params.id; //桌号
        let body = ctx.request.body;

        let foods = body.foods;


        let shoppingCarts = await ShoppingCarts.findAll({
            where: {
                tableUser: body.tableUser,
                FoodId: body.FoodId,
            }
        });

        if (shoppingCarts.length == 0) {
            ctx.body = {
                resCode: -1,
                result: "食品不存在！"
            }
            return;
        }
        let num = shoppingCarts[0].num + body.addNum;

        if (num == 0) {
            shoppingCarts[0].destroy();
        } else {
            shoppingCarts[0].num = num;
            shoppingCarts[0].save();
        }


        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    
    async deleteAdminOrderTableId (ctx, next) {
        ctx.checkParams('tableId');

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        let tableId = ctx.params.tableId; //订单id

        let orders = await Orders.findAll({
            where: {
                TableId: tableId,
                tenantId: ctx.query.tenantId,
                $or: [{status: 0}, {status: 1}]
            }
        });


        if (orders.length > 0) {
            orders.forEach(async function (e) {
                await e.destroy();
            })
        } else {
            ctx.body = {
                resCode: 0,
                result: "订单不存在"
            }
        }
        await modifyTableStatus(tableId, 0);

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    }
}