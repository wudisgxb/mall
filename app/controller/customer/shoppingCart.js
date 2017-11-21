const db = require('../../db/mysql/index');
const sequelizex = require('../../lib/sequelizex.js');
const ShoppingCarts = db.models.ShoppingCarts;
const Foods = db.models.Foods;
const Tables = db.models.Tables;
const webSocket = require('../../controller/socketManager/socketManager');
const tool = require('../../Tool/tool');
const ApiResult = require('../../db/mongo/ApiResult')

module.exports = {

    async getUserDealShoppingCart (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        const tenantId = ctx.query.tenantId;
        const tableName = ctx.query.tableName;

        let table = await Tables.findOne({
            where: {
                tenantId: tenantId,
                name: tableName,
                consigneeId: null
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let result = {};

        /**
         * 根据tableId查询所有购物车中的数据
         */
        let shoppingCarts = await ShoppingCarts.findAll({
            where: {
                TableId: table.id,
                tenantId: tenantId
            }
        })

        let foodArr = [];

        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;

        /**
         * 根据FoodId查询购物车中的数据
         * 返回food
         * 查询id,name,price,vipPrice的数据
         */
        for (var i = 0; i < shoppingCarts.length; i++) {
            var food = await Foods.findAll({
                where: {
                    id: shoppingCarts[i].FoodId,
                    tenantId: tenantId
                }
            })
            foodArr[i] = {};
            foodArr[i].id = food[0].id;
            foodArr[i].name = food[0].name;
            foodArr[i].price = food[0].price;
            foodArr[i].vipPrice = food[0].vipPrice;
            foodArr[i].num = shoppingCarts[i].num;
            foodArr[i].unit = shoppingCarts[i].unit;
            foodArr[i].remark = shoppingCarts[i].remark;
            foodArr[i].tableUser = shoppingCarts[i].tableUser;
            foodArr[i].tableUserNumber = shoppingCarts[i].tableUserNumber;
            totalNum += shoppingCarts[i].num;

            totalPrice += food[0].price * shoppingCarts[i].num;
            totalVipPrice += food[0].vipPrice * shoppingCarts[i].num;
        }
        result.tableName = tableName;
        result.foods = foodArr;
        result.totalNum = totalNum;
        result.totalPrice = Math.round(totalPrice * 100) / 100;
        result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
        console.log("AAAAAAAAAAAAAAAA||totalPrice=" + totalPrice);
        console.log("BBBBBBBBBBBBBBBB||totalVipPrice=" + totalVipPrice);

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)

    },

    async addUserDealShoppingCart (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('tableName').notEmpty();
        ctx.checkBody('foods').notEmpty();

        //ctx.checkParams('tableUserNumber').notEmpty().isInt().toInt();
        //ctx.checkBody('tableUser').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        const body = ctx.request.body;

        //获取tableId
        let table = await Tables.findOne({
            where: {
                tenantId: body.tenantId,
                name: body.tableName,
                consigneeId: null
            }
        })
        console.log(table)
        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let tableUserNumber = 1;
        let tableUserNumbers;
        console.log(body.tableUser)
        if (body.tableUser == null) {
            body.tableUser = tool.uuid();
            tableUserNumbers = await ShoppingCarts.findAll({
                where: {
                    TableId: table.id,
                    tenantId: body.tenantId,
                    consigneeId: null
                },
                attributes: ["tableUserNumber"],
            });

            if (tableUserNumbers.length > 0) {
                var tmp_tableUserNumbers = [];
                for (var i = 0; i < tableUserNumbers.length; i++) {
                    tmp_tableUserNumbers[i] = tableUserNumbers[i].tableUserNumber;
                }
                tableUserNumber = Math.max.apply(null, tmp_tableUserNumbers) + 1;
            }

        } else {
            tableUserNumbers = await ShoppingCarts.findAll({
                where: {
                    tableUser: body.tableUser,
                    tenantId: body.tenantId,
                    consigneeId: null
                },
                attributes: ["tableUserNumber"],
            });
            let tmp_tableUserNumbers = [];
            for (var i = 0; i < tableUserNumbers.length; i++) {
                tmp_tableUserNumbers[i] = tableUserNumbers[i].tableUserNumber;
            }
            if (tmp_tableUserNumbers.length == 0) {
                tableUserNumber = 1;
            } else {
                tableUserNumber = tmp_tableUserNumbers[0];
            }
        }

        let foods = body.foods;

        for (var i = 0; i < foods.length; i++) {

            var foodUnits = await Foods.findAll({
                where: {
                    id: foods[i].foodId,
                    tenantId: body.tenantId
                }
            });
            console.log(foodUnits)
            var shoppingCart = await ShoppingCarts.findOne({
                where: {
                    FoodId: foods[i].foodId,
                    tenantId: body.tenantId,
                    tableUser: body.tableUser,
                    TableId: table.id
                }
            })

            if (shoppingCart != null) {
                shoppingCart.num = foods[i].foodCount;
                await shoppingCart.save();
            } else {
                await ShoppingCarts.create({
                    num: foods[i].foodCount,
                    unit: foodUnits[0].unit,
                    FoodId: foods[i].foodId,
                    remark: foods[i].foodRemark,
                    TableId: table.id,
                    tableUser: body.tableUser,
                    tableUserNumber: tableUserNumber,
                    tenantId: body.tenantId,
                    consigneeId: null
                });
            }

        }

        //修改桌号状态
        //let table = await Tables.findById(id);
        if (table != null && table.status == 0) {
            //table.name = table.name;
            table.status = 1;

            await table.save();
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, body.tableUser)

        //通知管理台修改桌态
        var json = {"tableId": table.id, "status": 1};
        webSocket.sendSocket(JSON.stringify(json));
    },

    async updateUserDealShoppingCart (ctx, next) {
        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        ctx.checkBody('/condition/tableName', true).first().notEmpty();
        ctx.checkBody('/condition/tableUser', true).first().notEmpty();
        ctx.checkBody('/food/foodId', true).first().notEmpty();
        ctx.checkBody('/food/foodCount', true).first().notEmpty().isFloat().ge(0).toFloat();

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
                consigneeId: null
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        //查看food是否超库存
        let food = await Foods.findOne({
            where: {
                id: body.food.foodId,
            }
        })

        if (body.food.foodCount > food.rest) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, '商品库存不够！')
            return;
        }

        let shoppingCarts = await ShoppingCarts.findAll({
            where: {
                tableUser: body.condition.tableUser,
                TableId: table.id,
                FoodId: body.food.foodId,
                tenantId: body.condition.tenantId,
                consigneeId: null
            }
        });

        if (shoppingCarts.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "食品不存在！")
            return;
        }

        if (body.food.foodCount > 0) {
            shoppingCarts[0].num = body.food.foodCount;
            await shoppingCarts[0].save();
        } else {
            await shoppingCarts[0].destroy();
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getUserEshopShoppingCart (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        const tenantId = ctx.query.tenantId;
        const tableName = ctx.query.tableName;
        const consigneeId = ctx.query.consigneeId;
        const phoneNumber = ctx.query.phoneNumber;
        let goodsDiscountJson = {};
        let totalGoodsDiscount = 0;

        let table = await Tables.findOne({
            where: {
                tenantId: tenantId,
                name: tableName,
                consigneeId: consigneeId
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let result = {};

        /**
         * 根据tableId查询所有购物车中的数据
         */
        let shoppingCarts = await ShoppingCarts.findAll({
            where: {
                TableId: table.id,
                tenantId: tenantId,
                consigneeId: consigneeId,
                phone: phoneNumber
            }
        })


        let foodArr = [];

        let totalNum = 0;
        let totalPrice = 0;
        let totalVipPrice = 0;

        /**
         * 根据FoodId查询购物车中的数据
         * 返回food
         * 查询id,name,price,vipPrice的数据
         */
        for (var i = 0; i < shoppingCarts.length; i++) {
            var food = await Foods.findAll({
                where: {
                    id: shoppingCarts[i].FoodId,
                    tenantId: tenantId
                }
            })
            foodArr[i] = {};
            foodArr[i].id = food[0].id;
            foodArr[i].name = food[0].name;
            foodArr[i].price = food[0].price;
            foodArr[i].vipPrice = food[0].vipPrice;
            foodArr[i].num = shoppingCarts[i].num;
            foodArr[i].unit = shoppingCarts[i].unit;
            foodArr[i].remark = shoppingCarts[i].remark;
            totalNum += shoppingCarts[i].num;

            totalPrice += food[0].price * shoppingCarts[i].num;
            totalVipPrice += food[0].vipPrice * shoppingCarts[i].num;
        }
        result.tableName = tableName;
        result.phoneNumber = phoneNumber;
        result.foods = foodArr;
        result.totalNum = totalNum;
        result.totalPrice = Math.round(totalPrice * 100) / 100;
        result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, result)

    },

    async addUserEshopShoppingCart (ctx, next) {
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('tableName').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();
        ctx.checkBody('phoneNumber').notEmpty();
        ctx.checkBody('foods').notEmpty();
        //ctx.checkParams('tableUserNumber').notEmpty().isInt().toInt();
        //ctx.checkBody('tableUser').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        const body = ctx.request.body;

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

        let foods = body.foods;

        for (var i = 0; i < foods.length; i++) {
            var foodUnits = await Foods.findAll({
                where: {
                    id: foods[i].foodId,
                    tenantId: body.tenantId
                }
            });

            var shoppingCart = await ShoppingCarts.findOne({
                where: {
                    FoodId: foods[i].foodId,
                    tenantId: body.tenantId,
                    phone: body.phoneNumber,
                    TableId: table.id
                }
            })

            if (shoppingCart != null) {
                shoppingCart.num = shoppingCart.num + foods[i].foodCount;
                await shoppingCart.save();
            } else {
                await ShoppingCarts.create({
                    num: foods[i].foodCount,
                    unit: foodUnits[0].unit,
                    FoodId: foods[i].foodId,
                    remark: foods[i].foodRemark,
                    TableId: table.id,
                    consigneeId: body.consigneeId,
                    phone: body.phoneNumber,
                    tenantId: body.tenantId,
                });
            }
        }


        //修改桌号状态
        //let table = await Tables.findById(id);
        // if (table != null && table.status == 0) {
        //     //table.name = table.name;
        //     table.status = 1;
        //
        //     await table.save();
        // }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

        //通知管理台修改桌态
        var json = {"tableId": table.id, "status": 1};
        webSocket.sendSocket(JSON.stringify(json));
    },

    async updateUserEshopShoppingCart (ctx, next) {
        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        ctx.checkBody('/condition/tableName', true).first().notEmpty();
        ctx.checkBody('/condition/consigneeId', true).first().notEmpty();
        ctx.checkBody('/condition/phoneNumber', true).first().notEmpty();
        ctx.checkBody('/food/foodId', true).first().notEmpty();
        ctx.checkBody('/food/foodCount', true).first().notEmpty().isFloat().ge(0).toFloat();

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
        //查看food是否超库存
        let food = await Foods.findOne({
            where: {
                id: body.food.foodId,
            }
        })

        if (body.food.foodCount > food.rest) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, '商品库存不够！')
            return;
        }

        let shoppingCarts = await ShoppingCarts.findAll({
            where: {
                consigneeId: body.condition.consigneeId,
                phone: body.condition.phoneNumber,
                TableId: table.id,
                FoodId: body.food.foodId,
                tenantId: body.condition.tenantId
            }
        });

        if (shoppingCarts.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "食品不存在！")
            return;
        }

        if (body.food.foodCount > 0) {
            shoppingCarts[0].num = body.food.foodCount;
            await shoppingCarts[0].save();
        } else {
            await shoppingCarts[0].destroy();
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
}
