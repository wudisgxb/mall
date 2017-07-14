const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let HotSaleFood = db.models.HotSaleFood;
let Foods = db.models.Foods;


module.exports = {


    async saveHostSaleFood(ctx,next){
        ctx.checkBody('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body=new ApiResult(ApiResult.Result.DB_ERROR)
            return;
        }
        let body = ctx.request.body;
        let ArrayFood=[];

        let lastDate = new Date()
        lastDate.setDate(0);
        let b = lastDate.format("yyyy-MM-dd 23:59:59");


        let firstDate = new Date();
        firstDate.setDate(0);
        firstDate.setDate(0)
        let a = firstDate.format("yyyy-MM-dd 23:59:59");

        console.log(b);
        console.log(a);
        let order;
        let orderNum;
        // for(let i = date.getTime()-2592000000;i<date.getTime();i=i+86400000){
        //根据tenantId和时间查询一个月前到今天的所有订单记录
        order = await Orders.findAll({
            where:{
                tenantId:body.tenantId,
                createdAt:{
                    $lt:new Date(b),
                    $gte:new Date(a)
                }
            },
            paranoid: false
        })
        //console.log(order[0].id);
        if(order.length==0){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"上个月没有记录")
            return;
        }
        // }
        // console.log(new Date(date.getTime()-2592000000))
        // console.log(new Date(date))
        //将不同菜品的订单放入数组中
        for(let i=0;i<order.length;i++){
            if(!ArrayFood.contains(order[i].FoodId)){
                ArrayFood.push(order[i].FoodId)
            }
        }
        console.log(ArrayFood);

        //根据菜单查询order中的数量
        let num=0;
        let foodJson={}
        let food;
        for(let j=0;j<ArrayFood.length;j++){
            orderNum=await Orders.findAll({
                where:{
                    tenantId:body.tenantId,
                    createdAt:{
                        $lt:new Date(b),
                        $gte:new Date(a)
                    },
                    FoodId:ArrayFood[j]
                },
                paranoid: false
            })
            for(var i = 0;i<orderNum.length;i++){
                num+=orderNum[i].num
            }
            // console.log(num)
            // console.log("111")
            // console.log(orderNum[j].FoodId)
            food = await Foods.findAll({
                where:{
                    id:orderNum[j].FoodId
                },
                attributes:["name"]
            })
            console.log("111")
            console.log(food[0].name)
                foodJson.name="月热销榜";
                foodJson.type=1;
                foodJson.tenantId=orderNum[j].tenantId,
                foodJson.num=num,
                foodJson.foodName=food[0].name
        }
        //将当前一个月的销售量全部打印出来
        ctx.body=new ApiResult(ApiResult.Result.success,foodJson);
    },
}