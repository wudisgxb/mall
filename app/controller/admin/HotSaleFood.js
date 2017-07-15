// const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
// const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
// let Orders = db.models.Orders;
// let HotSaleFood = db.models.HotSaleFood;
let Foods = db.models.Foods;

let getFoodNum = require('../../controller/statistics/statistics');

module.exports = {
    async saveHostSaleFood(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('num').notEmpty();
        let body = ctx.request.body
        let results=[];
        let result;

        let resultId;
        result = await getFoodNum.getFood(body.tenantId,body.num);

        resultId = result.sort((a, b)=>b.num - a.num);
        for (let k = 0; k < body.num; k++) {
            results.push(resultId[k])
        }
        let foods;
        console.log(results)
        for(let i=0;i<results.length;i++){
            foods = await Foods.findById(results[i].id)
            results[i].name = foods.name;
            results[i].image=foods.image;
            results[i].taste=foods.taste;
            results[i].rating=foods.rating;
            results[i].type=foods.type;
            results[i].price=foods.price;
            results[i].info=foods.info;
        }
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS,results)
    }

}


// module.exports = {
//     async saveHostSaleFood(ctx, next){
//         ctx.checkBody('tenantId').notEmpty();
//         //取销售量最高的前num条
//         ctx.checkBody('num').notEmpty();
//         if (ctx.errors) {
//             ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,ctx.errors)
//             return;
//         }
//         let body = ctx.request.body;
//         let ArrayFood = [];
//
//         let lastDate = new Date()
//         lastDate.setDate(0);
//         let b = lastDate.format("yyyy-MM-dd 23:59:59");
//
//
//         let firstDate = new Date();
//         firstDate.setDate(0);
//         firstDate.setDate(0)
//         let a = firstDate.format("yyyy-MM-dd 23:59:59");
//
//         console.log(b);
//         console.log(a);
//         let order;
//         let orderNum;
//         // for(let i = date.getTime()-2592000000;i<date.getTime();i=i+86400000){
//         //根据tenantId和时间查询一个月前到今天的所有订单记录
//         order = await Orders.findAll({
//             where: {
//                 tenantId: body.tenantId,
//                 createdAt: {
//                     $lt: new Date(b),
//                     $gte: new Date(a)
//                 }
//             },
//             paranoid: false
//         })
//         //console.log(order[0].id);
//         if (order.length == 0) {
//             ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "上个月没有记录")
//             return;
//         }
//         // }
//         // console.log(new Date(date.getTime()-2592000000))
//         // console.log(new Date(date))
//         //将不同菜品的订单放入数组中
//         for (let i = 0; i < order.length; i++) {
//             if (!ArrayFood.contains(order[i].FoodId)) {
//                 ArrayFood.push(order[i].FoodId)
//             }
//         }
//
//         console.log(ArrayFood);
//
//         //根据菜单查询order中的数量
//         // let orders;
//         // for (let j = 0; j < ArrayFood.length; j++) {
//         //     orders = await Orders.sum("num", {
//         //         where: {
//         //             FoodId: ArrayFood[j]
//         //         }
//         //     })
//         //         .then(num => {
//         //             console.log(num)
//         //         })
//         // }
//         let resultId=[];
//         let result = []
//         let results = [];
//
//         //查询num的总和
//         for (let id of ArrayFood) {
//             const num = await Orders.sum('num', {
//                 where: {
//                     FoodId: id
//                 },
//                 paranoid: false
//             })
//             result.push({id, num})
//         }
//         resultId = result.sort((a,b)=>b.num-a.num);
//         for(let k=0;k<body.num;k++){
//             results.push(resultId[k])
//         }
//
//
//
//
//
//         console.log(resultId)
//         console.log(result)
//         console.log(results)
//         //将当前一个月的销售量全部打印出来
//         ctx.body = new ApiResult(ApiResult.Result.success, results);
//     },
// }