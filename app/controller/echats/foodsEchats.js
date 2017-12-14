const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let NewOrders = db.models.NewOrders;
let OrderGoods = db.models.OrderGoods;
let Foods = db.models.Foods;
let getWeek_EveryYeay = require('../echats/getWeek')
let oneDay = require('../echats/oneDayEchat')


const getFoodEchats = (function () {

    let getfEchats = async function (tenantId,startTime,type) {
        //type为1是日报表，2为月报表，3为周报表，4为季度报表，5为年报表
        if(type==1){
            let startDate = new Date(startTime)

            let start = startDate.format("yyyy-MM-dd");

            let endDate = startDate.setDate(new Date(startTime).getDate()+1)

            let end = new Date(endDate).format("yyyy-MM-dd")
            let day=oneDay.getDay(start,end);
            let result = [];
            for(let i = 0; i < day.length; i++){
                let orderTradeNoArray = []
                let neworder = await NewOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        status : {
                            $gte : 2
                        },
                        createdAt:{
                            $gt:day[i].start,
                            $lt:day[i].end
                        }
                    }
                })
                let ArrayFoodName=[]
                let jsonFoodName={}
                for(let j = 0; j< neworder.length; j++){
                    orderTradeNoArray.push(neworder[i].trade_no)
                    let ordergoods = await OrderGoods.findAll({
                        where:{
                            tenantId : tenantId,
                            trade_no:neworder[i].trade_no
                        }
                    })

                    for(let k = 0; k<ordergoods.length; k++){
                        if(!ArrayFoodName.contains(ordergoods[k].goodsName)){
                            ArrayFoodName.push(ordergoods[k].goodsName)
                        }
                    }
                }

                for(let g = 0; g<ArrayFoodName.length; g++){
                    console.log(ArrayFoodName[g])
                    let ordergoodsNum = await OrderGoods.sum("num",{
                        where:{
                            tenantId : tenantId,
                            goodsName:ArrayFoodName[g],
                            createdAt:{
                                $gt:day[i].start,
                                $lte:day[i].end
                            }
                        }
                    })
                    let ordergood = await OrderGoods.findOne({
                        where:{
                            tenantId : tenantId,
                            goodsName: ArrayFoodName[g],
                            createdAt:{
                                $gt:day[i].start,
                                $lte:day[i].end
                            }
                        }
                    })
                    jsonFoodName={
                        price : ordergood.price,
                        goodsName : ArrayFoodName[g],
                        consume : Number(ordergood.price)*ordergoodsNum,
                        vipConsume:ordergood.vipPrice*ordergoodsNum,
                        time: day[i].start,
                        num : ordergoodsNum
                    }
                    result.push(jsonFoodName)
                }



                // let order = await NewOrders.findAll({
                //     where:{
                //         tenantId : tenantId,
                //         createdAt:{
                //             $gt:day[i].start,
                //             $lte:day[i].end
                //         },
                //         status : {
                //             $gte : 2
                //         }
                //     }
                // })
                // let orderTrade_no = []
                // for(let j = 0 ; j< order.length;j++){
                //     orderTrade_no.push(order[j].trade_no)
                // }
                //
                // let ordergoods = await OrderGoods.findAll({
                //     where:{
                //         tenantId : tenantId,
                //         trade_no : {
                //             $in : orderTrade_no
                //         }
                //     }
                // })
                //
                // let trade_noArray=[]
                // let nameArray = []
                // for(let i = 0; i < ordergoods.length; i++){
                //     if(!trade_noArray.contains(ordergoods[i].trade_no)){
                //         trade_noArray.push(ordergoods[i].trade_no)
                //     }
                //     if(!nameArray.contains(ordergoods[i].goodsName)){
                //         nameArray.push(ordergoods[i].goodsName)
                //     }
                // }
                //
                // let difference = orderTrade_no.concat(trade_noArray).filter(v => !orderTrade_no.includes(v) || !trade_noArray.includes(v))
                //
                // for(let k = 0; k < nameArray.length; k++){
                //     let ordergoodsNum = await OrderGoods.sum("num",{
                //         where:{
                //             tenantId : tenantId,
                //             goodsName: nameArray[k],
                //             // trade_no : {
                //             //     $notIn : difference
                //             // },
                //             createdAt:{
                //                 $gt:day[i].start,
                //                 $lte:day[i].end
                //             }
                //         }
                //     })
                //     console.log(ordergoodsNum)
                //     let ordergoodsPrice = await OrderGoods.findOne({
                //         where:{
                //             tenantId : tenantId,
                //             goodsName: nameArray[k],
                //         }
                //     })
                //
                //     jsonFoodName={
                //         price : ordergoodsPrice.price,
                //         goodsName : nameArray[k],
                //         consume : Number(ordergoodsPrice.price)*ordergoodsNum,
                //         vipConsume:ordergoodsPrice.vipPrice*ordergoodsNum,
                //         time: day[i].start,
                //         num : ordergoodsNum
                //     }
                //     result.push(jsonFoodName)
                // }

            }
            return result;
        }

        if(type==2){

            let foodName = [];
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
            let neworders = await NewOrders.findAll({
                where: {
                    tenantId: tenantId,
                    status : 2,
                    createdAt: {
                        $gte:new Date(startDate),
                        $lt:new Date(endDate)
                    }
                }
            })
            console.log(neworders.length)
            let orders=[]
            for (let i = 0; i < neworders.length; i++){
                orders = await OrderGoods.findAll({
                    where:{
                        trade_no : neworders[i].trade_no
                    }
                })
                for(let j=0;j<orders.length;j++){
                    if(!foodName.contains(orders[j].goodsName)){
                        foodName.push(orders[j].goodsName)
                    }
                }
            }
            for (let name of foodName) {
                let num = await OrderGoods.sum('num', {
                    where: {

                        tenantId : tenantId,
                        goodsName: name,
                        createdAt: {
                            $gt:startDate,
                            $lt:endDate
                        }
                    }
                })
                let order = await OrderGoods.findOne({
                    where:{
                        tenantId : tenantId,
                        goodsName: name,
                        createdAt: {
                            $gt:startDate,
                            $lt:endDate
                        }
                    }
                })
                result.push({
                    price : order.price,
                    goodsName : name,
                    consume : order.price*num,
                    vipConsume:order.vipPrice*num,
                    time: "第"+quarter+"季度",
                    num: num
                })
            }
            return result;
        }

        if(type==3){
            let foodName=[];
            let result=[];
            let newDate  = new Date(startTime)
            let startDate = newDate.format("yyyy-MM-dd 00:00:00")

            let endTime = newDate.setMonth(new Date(startTime).getMonth()+1)
            let endDate = new Date(endTime).format("yyyy-MM-dd 00:00:00")

            // let quarter = Math.floor(3/3)

            let neworders = await NewOrders.findAll({
                where: {
                    tenantId: tenantId,
                    status : 2,
                    createdAt: {
                        $gte:new Date(startDate),
                        $lt:new Date(endDate)
                    }
                }
            })
            console.log(neworders.length)
            let orders=[]
            for (let i = 0; i < neworders.length; i++){
                orders = await OrderGoods.findAll({
                    where:{
                        trade_no : neworders[i].trade_no
                    }
                })
                for(let j=0;j<orders.length;j++){
                    if(!foodName.contains(orders[j].goodsName)){
                        foodName.push(orders[j].goodsName)
                    }
                }
            }
            for (let name of foodName) {
                let num = await OrderGoods.sum('num', {
                    where: {
                        tenantId : tenantId,
                        goodsName: name,
                        createdAt: {
                            $gt:new Date(startDate),
                            $lt:new Date(endDate)
                        }
                    }
                })
                let order = await OrderGoods.findOne({
                    where:{
                        tenantId : tenantId,
                        goodsName: name,
                        createdAt: {
                            $gt:new Date(startDate),
                            $lt:new Date(endDate)
                        }
                    }
                })

                result.push({
                    price : order.price,
                    goodsName : name,
                    consume : order.price*num,
                    vipConsume:order.vipPrice*num,
                    time: "第"+startDate.substring(5,7)+"月",
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
            let foodName = [];
            let result = [];

            let neworders = await NewOrders.findAll({
                where: {
                    tenantId: tenantId,
                    status : 2,
                    createdAt: {
                        $gte:new Date(startDate),
                        $lt:new Date(endDate)
                    }
                }
            })
            console.log(neworders.length)
            let orders=[]
            for (let i = 0; i < neworders.length; i++){
                orders = await OrderGoods.findAll({
                    where:{
                        trade_no : neworders[i].trade_no
                    }
                })
                for(let j=0;j<orders.length;j++){
                    if(!foodName.contains(orders[j].goodsName)){
                        foodName.push(orders[j].goodsName)
                    }
                }
            }
            for (let name of foodName) {
                let num = await OrderGoods.sum('num', {
                    where: {
                        tenantId : tenantId,
                        goodsName: name,
                        createdAt: {
                            $gt:new Date(startDate),
                            $lt:new Date(endDate)
                        }
                    }
                })
                let order = await OrderGoods.findOne({
                    where:{
                        tenantId : tenantId,
                        goodsName: name,
                        createdAt: {
                            $gt:new Date(startDate),
                            $lt:new Date(endDate)
                        }
                    }
                })

                result.push({
                    price : order.price,
                    goodsName : name,
                    consume : order.price*num,
                    vipConsume:order.vipPrice*num,
                    time: "第"+startDate.substring(0,4)+"年",
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