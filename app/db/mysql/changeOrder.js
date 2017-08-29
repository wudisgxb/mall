var db = require('./index.js');
var dbstatistic = require("../statisticsMySql/index")
var co = require('co');

var util = require('util');
var tool = require('../../Tool/tool');

function *orderToOrderGoods() {
    let orders = yield db.models.Orders.findAll({
        where: {},
        paranoid: false
    });

    for (var i = 0; i < orders.length; i++) {
        yield db.models.OrderGoods.create({
            num: orders[i].num,
            unit: orders[i].unit,
            trade_no: orders[i].trade_no,
            tenantId: orders[i].tenantId,
            consigneeId: orders[i].consigneeId,
            createdAt: orders[i].createdAt,
            // updatedAt: orders[i].updatedAt,
            //deletedAt: orders[i].deletedAt,
            FoodId: orders[i].FoodId,
        });
    }

    // let orders = yield db.models.Orders.findAll({
    //     where:{
    //         $or: [{status: 0}, {status: 1}],
    //     },
    //     paranoid: false
    // });
    //
    // for (var i = 0;i<orders.length;i++) {
    //     yield orders[i].destroy();
    // }

}

function *orderToNewOrder() {
    let orders = yield db.models.Orders.findAll({
        where: {},
        paranoid: false
    });

    let tradeNoArray = [];//订单号
    for (var i = 0; i < orders.length; i++) {
        if (!tradeNoArray.contains(orders[i].trade_no)) {
            tradeNoArray.push(orders[i].trade_no);
        }
    }

    for (var i = 0; i < tradeNoArray.length; i++) {

        var orders1 = yield db.models.Orders.findAll({
            where: {
                trade_no: tradeNoArray[i]
            },
            paranoid: false
        });

        yield db.models.NewOrders.create({
            status: orders1[0].status,
            info: orders1[0].info,
            phone: orders1[0].phone,
            diners_num: orders1[0].diners_num,
            trade_no: orders1[0].trade_no,
            tenantId: orders1[0].tenantId,
            consigneeId: orders1[0].consigneeId,
            createdAt: orders1[0].createdAt,
            // updatedAt: orders[i].updatedAt,
            deletedAt: orders1[0].deletedAt,
            TableId: orders1[0].TableId,
        });
    }

}

function *test() {
    let order = yield db.models.Orders.findOne({
        where: {
            id: 228
        },
        paranoid: false
    });

    order.deletedAt = null;
    yield order.save();

}

//ordergoods表转静态，food价格放进去
function *orderGood() {
    let orderGoods = yield db.models.OrderGoods.findAll({
        where: {},
        paranoid: false
    });

    let tasks = [];
    let startTime = new Date().getTime();
    console.log("startTime:"+ startTime);
    for (var i = 0; i < orderGoods.length; i++) {
        if (orderGoods[i].FoodId != null) {
            var food = yield db.models.Foods.findOne({
                where: {
                    id:orderGoods[i].FoodId
                },
            });
            orderGoods[i].price = food.price;
            orderGoods[i].vipPrice = food.vipPrice;
            //yield orderGoods[i].save()
            tasks.push(orderGoods[i].save());
        }
    }
    yield tasks;
    let endTime = new Date().getTime();
    console.log("endTime:"+ endTime);
    console.log("差值:"+ (endTime - startTime));
}

co(function *() {
    //yield orderToNewOrder();
    //
    //yield orderToOrderGoods();

    yield orderGood();
    //yield test();
    console.log('finished ...');
    process.exit(0)
}).catch(function () {
    console.log(arguments);
});
