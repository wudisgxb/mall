const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let Foods = db.models.Foods;
let getWeek_EveryYeay = require('../echats/getWeek')


const getFoodEchats = (function () {

    let getfEchats = async function (tenantId,startTime,type) {
        //type为1是日报表，2为月报表，3为周报表，4为季度报表，5为年报表
        if(type==1){
            let orderEchats=[];
            let result=[];

            let orders=[]
            let endDate = new Date(startTime).format("yyyy-MM-dd 23:59:59");
            for (let i = new Date(startTime).getTime(); i<new Date(endDate).getTime(); i = i + 86400000) {
                let foodId=[];
                let startDate = new Date(i).format("yyyy-MM-dd 01:00:00");
                // let endDate = new Date(i).format("yyyy-MM-dd 23:59:59");
                orders = await Orders.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte:new Date(startDate),
                            $lt:new Date(endDate)
                        }
                    },
                    paranoid: false
                })

                for(let j=0;j<orders.length;j++){

                    if(!foodId.contains(orders[j].FoodId)){
                        foodId.push(orders[j].FoodId)
                    }
                }

                for (let id of foodId) {
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: id,
                            createdAt: {
                                $lt: new  Date(endDate),
                                $gte: new Date(startDate)
                            }
                        },
                        paranoid: false
                    })
                    let food = await Foods.findOne({
                        where:{
                            id:id
                        }
                    })
                    result.push({
                        FoodId:food.name,
                        consume:food.price*num,
                        vipConsume:food.vipPrice*num,
                        time: new Date(startDate).format("yyyy-MM-dd"),
                        num: num
                    })
                }


            }
            return result;


        }
        if(type==2){
            let orders=[];
            let foodId = [];
            let result=[];
            //如startTime为20171表示2017年第一季度
            //截取年份2017

            let year = startTime.substring(0,4);
            let years = parseInt(year)
            //截取季度1
            let quarter = startTime.substring(4,5);
            //算出季度对应的月份
            //初始月份季度为1初始月份为1月1号0时 Month为0
            let startMonth = (quarter-1)*3//季度1初始月份为setMonth(0)
            //结束月份 Month为2
            let endMonth = quarter*3
            //初始时间
            let startDate = new Date()
            startDate.setFullYear(years,startMonth,1)
            startDate.format("yyyy-MM-dd 00:00:00");
            //结束时间
            let endDate = new Date()
            endDate.setFullYear(years,endMonth,0)
            endDate.format("yyyy-MM-dd 23:59:59");

            //获得初始月份的值循环
            orders = await Orders.findAll({
                where: {
                    tenantId: tenantId,
                    createdAt: {
                        $gte:new Date(startDate),
                        $lt:new Date(endDate)
                    }
                },
                paranoid:false
            })

            for(let j=0;j<orders.length;j++){

                if(!foodId.contains(orders[j].FoodId)){
                    foodId.push(orders[j].FoodId)
                }
            }

            for (let id of foodId) {
                let num = await Orders.sum('num', {
                    where: {
                        FoodId: id,
                        createdAt: {
                            $gt:startDate,
                            $lt:endDate
                        }
                    },
                    paranoid: false
                })
                let food = await Foods.findOne({
                    where:{
                        id:id
                    }
                })
                result.push({
                    FoodId:food.name,
                    price:food.price*num,
                    vipPrice:food.vipPrice*num,
                    time: "第"+quarter+"季度",
                    num: num
                })
            }
            return result;
        }
        if(type==3){
            let foodId=[];
            let result=[];
            let newDate  = new Date(startTime)
            let startDate = newDate.format("yyyy-MM-dd 00:00:00")

            let endTime = newDate.setMonth(new Date(startTime).getMonth()+1)
            let endDate = new Date(endTime).format("yyyy-MM-dd 00:00:00")

            // let quarter = Math.floor(3/3)

            let orders = await Orders.findAll({
                where: {
                    tenantId: tenantId,
                    createdAt: {
                        $lt: new Date(endDate),
                        $gte: new Date(startDate)
                    }
                },
                paranoid: false
            })
            for(let j=0;j<orders.length;j++){
                if(!foodId.contains(orders[j].FoodId)){
                    foodId.push(orders[j].FoodId)
                }
            }

            for (let id of foodId) {
                let num = await Orders.sum('num', {
                    where: {
                        FoodId: id,
                        createdAt: {
                            $lt: new Date(endDate),
                            $gte: new Date(startDate)
                        }
                    },
                    paranoid: false
                })
                let food = await Foods.findOne({
                    where:{
                        id:id
                    }
                })
                result.push({
                    FoodId:food.name,
                    price:food.price*num,
                    vipPrice:food.vipPrice*num,
                    time: new Date(startTime).format("yyyy-MM-dd"),
                    num: num
                })
            }
            return result;

        }
        //年份报表
        if(type==4){
            //let year = parseInt(startTime);
            let newDate = new Date(startTime)
            newDate.setMonth(0,1);
            let startDate = newDate.format("yyyy-MM-dd 0:0:0")
            // console.log(startDate)
            let endTime = new Date(startTime)
            endTime.setMonth(11,31);
            let endDate = endTime.format("yyyy-MM-dd 23:59:59")
            // console.log(endDate)
            let foodId = [];
            let result = [];

            let orders = await Orders.findAll({
                where: {
                    tenantId: tenantId,
                    createdAt: {
                        $lt: new Date(endDate),
                        $gte: new Date(startDate)
                    }
                },
                paranoid: false
            })
            for(let j=0;j<orders.length;j++){
                if(!foodId.contains(orders[j].FoodId)){
                    foodId.push(orders[j].FoodId)
                }
            }
            // console.log(foodId.length);
            for (let id of foodId) {
                let num = await Orders.sum('num', {
                    where: {
                        FoodId: id,
                        createdAt: {
                            $lt: new Date(endDate),
                            $gte: new Date(startDate)
                        }
                    },
                    paranoid: false
                })
                let food = await Foods.findOne({
                    where:{
                        id:id
                    }
                })
                result.push({
                    FoodId:food.name,
                    price:food.price*num,
                    vipPrice:food.vipPrice*num,
                    time: new Date(startTime).getFullYear(),
                    num: num
                })
            }
            return result;
        }

    }
    let instance = {
        getfEchats: getfEchats
    }
    return instance;
})();
module.exports = getFoodEchats;