let db = require('../../db/mysql/index');
let sequelizex = require('../../lib/sequelizex.js');
let ShoppingCarts = db.models.ShoppingCarts;
let Foods = db.models.Foods;
let Tables = db.models.Tables;
let webSocket = require('../../controller/socketManager/socketManager');
var tool = require('../../Tool/tool');
const ApiResult = require('../../db/mongo/ApiResult')

module.exports = {

    async getUserfoodShoppingCartByTableId (ctx, next) {
        ctx.checkParams('TableId').notEmpty().isInt().toInt();
        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        var tableId = ctx.params.TableId;
        var result = {};

        /**
         * 根据tableId查询所有购物车中的数据
         */
        var shoppingCarts = await ShoppingCarts.findAll({
            where: {
                TableId: tableId,
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        })
        var foodJson = [];

        var totalNum = 0;
        var totalPrice = 0;
        var totalVipPrice = 0;

        /**
         * 根据FoodId查询购物车中的数据
         * 返回food
         * 查询id,name,price,vipPrice的数据
         */
        for (var i = 0; i < shoppingCarts.length; i++) {
            var food = await Foods.findAll({
                where: {
                    id: shoppingCarts[i].FoodId,
                },
                attributes: ["id", "name", "price", "vipPrice"],
            })
            foodJson[i] = {};
            foodJson[i].id = food[0].id;
            foodJson[i].name = food[0].name;
            foodJson[i].price = food[0].price;
            foodJson[i].vipPrice = food[0].vipPrice;
            foodJson[i].num = shoppingCarts[i].num;
            foodJson[i].unit = shoppingCarts[i].unit;
            foodJson[i].remark = shoppingCarts[i].remark;
            foodJson[i].tableUser = shoppingCarts[i].tableUser;
            foodJson[i].tableUserNumber = shoppingCarts[i].tableUserNumber;
            totalNum += shoppingCarts[i].num;

            totalPrice += food[0].price * shoppingCarts[i].num;
            totalVipPrice += food[0].vipPrice * shoppingCarts[i].num;
        }
        result.tableId = tableId;
        result.foods = foodJson;
        result.totalNum = totalNum;
        result.totalPrice = Math.round(totalPrice * 100) / 100;
        result.totalVipPrice = Math.round(totalVipPrice * 100) / 100;
        console.log("AAAAAAAAAAAAAAAA||totalPrice=" + totalPrice);
        console.log("BBBBBBBBBBBBBBBB||totalVipPrice=" + totalVipPrice);

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, resultArray)

    },

    async updateUserfoodShoppingCartAddById (ctx, next) {
        ctx.checkParams('id').notEmpty().isInt().toInt();
        ctx.checkBody('foods').notEmpty();
        //ctx.checkParams('tableUserNumber').notEmpty().isInt().toInt();
        //ctx.checkBody('tableUser').notEmpty();

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        var id = ctx.params.id; //桌号
        var body = ctx.request.body;

        var tableUserNumber = 1;

        if (body.tableUser == null) {
            body.tableUser = tool.uuid();
            var tableUserNumbers = await ShoppingCarts.findAll({
                where: {
                    TableId: id,
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
            var tableUserNumbers = await ShoppingCarts.findAll({
                where: {
                    tableUser: body.tableUser,
                },
                attributes: ["tableUserNumber"],
            });
            var tmp_tableUserNumbers = [];
            for (var i = 0; i < tableUserNumbers.length; i++) {
                tmp_tableUserNumbers[i] = tableUserNumbers[i].tableUserNumber;
            }
            if (tmp_tableUserNumbers.length == 0) {
                tableUserNumber = 1;
            } else {
                tableUserNumber = tmp_tableUserNumbers[0];
            }
        }

        var foods = body.foods;

        var createFoodShoppingCartTask = [];

        for (var i = 0; i < foods.length; i++) {

            var foodUnits = await Foods.findAll({
                where: {
                    id: foods[i].FoodId,
                }
            });
            createFoodShoppingCartTask.push(ShoppingCarts.create({
                num: foods[i].num,
                unit: foodUnits[0].unit,
                FoodId: foods[i].FoodId,
                remark: foods[i].remark,
                TableId: id,
                tableUser: body.tableUser,
                tableUserNumber: tableUserNumber
            }));
        }

        await createFoodShoppingCartTask;

        //修改桌号状态

        var table = await Tables.findById(id);
        if (table != null && table.status == 0) {
            table.name = table.name;
            table.status = 1;

            await table.save();
        }

        ctx.body = {
            resCode: 0,
            result: body.tableUser
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, tableUser)

        //通知管理台修改桌态
        var json = {"tableId": id, "status": 1};
        webSocket.sendSocket(JSON.stringify(json));

    },

    async updateUserfoodShoppingCartEditById (ctx, next) {
        ctx.checkParams('id').notEmpty().isInt().toInt();
        ctx.checkBody('FoodId').notEmpty();
        ctx.checkBody('addNum').notEmpty().isInt();
        ctx.checkBody('tableUser').notEmpty();

        if (ctx.errors) {
            ctx.body = ctx.errors;
            return;
        }

        var id = ctx.params.id; //桌号
        var body = ctx.request.body;

        var foods = body.foods;


        var shoppingCarts = await ShoppingCarts.findAll({
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

        if (body.addNum == 0) {
            if (body.newNum != null) {
                shoppingCarts[0].num = body.newNum;
                await shoppingCarts[0].save();
            } else {
                await shoppingCarts[0].destroy();
            }

        } else {
            var num = shoppingCarts[0].num + body.addNum;

            if (num == 0) {
                await shoppingCarts[0].destroy();
            } else {
                shoppingCarts[0].num = num;
                await shoppingCarts[0].save();
            }
        }


        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, tableUser)


    }


}