const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const PaymentReqs = db.models.PaymentReqs;
const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
const Tool = require('../../Tool/tool')

module.exports = {

    async countSales (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('endTime').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;
        let amounts = 0;
        let array = [];

        for (let i = new Date(body.startTime).getTime(); i <= new Date(body.endTime).getTime(); i = i + 86400000) {
            if (body.consigneeId == 'all') {
                amounts = await PaymentReqs.sum(
                    'actual_amount',
                    {
                        where: {
                            createdAt: {
                                $lt: new Date(i + 86400000),
                                $gte: new Date(i)
                            },
                            isFinish: true,
                            tenantId: body.tenantId
                        }
                    }
                )
            } else {
                amounts = await PaymentReqs.sum(
                    'actual_amount',
                    {
                        where: {
                            createdAt: {
                                $lt: new Date(i + 86400000),
                                $gte: new Date(i)
                            },
                            isFinish: true,
                            tenantId: body.tenantId,
                            consigneeId: body.consigneeId
                        }
                    }
                )
            }

            if (amounts == null) {
                amounts = 0
            }

            array.push({
                time: new Date(i).format("yyyy-MM-dd"),
                amounts: amounts
            })
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, array);
    },


    async countFoods (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('time').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }

        let body = ctx.request.body;
        let amounts = 0;
        let array = [];
        let foodNumArray = []
        let paymentReqs;
        //if (body.consigneeId == 'all') {


        let order = await Orders.findAll(
            {
                where: {
                    createdAt: {
                        $lt: new Date(new Date(body.time).getTime() + 86400000),
                        $gte: new Date(new Date(body.time).getTime())
                    },
                    status: 2,
                    tenantId: body.tenantId
                }
            }
        )

        let orders = await OrderGoods.findAll({
            where:{
                trade_no:order.trade_no
            }
        })

        var foodIdArray = [];//FOODID

        for (var j = 0; j < orders.length; j++) {
            if (!foodIdArray.contains(orders[j].FoodId)) {
                foodIdArray.push(orders[j].FoodId);
            }
        }

        for (var k = 0; k < foodIdArray.length; k++) {
            var num = await Orders.sum(
                'num',
                {
                    where: {
                        createdAt: {
                            $lt: new Date(new Date(body.time).getTime() + 86400000),
                            $gte: new Date(new Date(body.time).getTime())
                        },
                        status: 2,
                        tenantId: body.tenantId,
                        FoodId: foodIdArray[k]
                    }
                }
            )
            foodNumArray.push({
                "foodId": foodIdArray[k],
                "num": num
            })
        }


        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, foodNumArray);
    }

}