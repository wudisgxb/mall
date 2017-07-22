
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let getMonthEchats = require('../echats/MonthEchats')
let getQuarterEchats = require('../echats/quarterEchats')
let getYearEchat = require('../echats/yearEchat')


const getConsumptionEchats = (function () {
    let getConsumption = async function (tenantId,startTime,endTime,type) {
        //type=1为每日平均消费多少元，type==2为每月消费，type==3为每季度消费。type==4为每年消费
        if(type==1){
            let result=[];
            //startTime开始时间
            //endTime结束时间
            const oneDay = 24*60*60*1000;
            let arrayTrade_no = [];
            let foodId = [];
            let numprice=0;
            for(let i=new Date(startTime).getTime();i<new Date(endTime).getTime();i+=oneDay){
                let orders = await Orders.findAll({
                    where:{
                        tenantId:tenantId,
                        status:2,
                        createdAt:{
                            $gt:new Date(i),
                            $lt:new Date(i+oneDay)
                        }
                    }
                })
                console.log("---------")
                console.log(orders.length)
                for(let i = 0;i < orders.length;i++){
                    if(!arrayTrade_no.contains(orders[i].trade_no)){
                        arrayTrade_no.push(orders[i].trade_no)
                    }
                }
                for(let i = 0;i < orders.length;i++){
                    if(!foodId.contains(orders[i].FoodId)){
                        foodId.push(orders[i].FoodId)
                    }
                }
                for(let j = 0;j < foodId.length;j++){
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: foodId[j],
                            status:2,
                            createdAt: {
                                $lt: new Date(i+oneDay),
                                $gte: new Date(i)
                            }
                        },
                        paranoid: false
                    })
                    let foodname = await Orders.findById(foodId[j])
                    let price = foodname.price*num
                    numprice=numprice+price
                }
                let time = new Date(i);
                time.setDate(time.getDate()+1)
                let times = time.format("yyyy-MM-dd 0:0:0");
                result.push({
                    numPrice:numprice,
                    numPeople:arrayTrade_no.length,
                    avgPrive:numprice/arrayTrade_no.length,
                    time:new Date(times)
                })
            }
            return result;
        }

        if(type==2){
            let result = [];
            let arrayTrade_no=[];
            let foodId =[];
            let numprice = 0;
            let getMonthEchats = await getMonthEchats.getMonth(startTime,endTime);
            for(let i = 0; i < getMonthEchats.length; i++){
                let orders = await Orders.findAll({
                    where:{
                        tenantId:tenantId,
                        status:2,
                        createdAt:{
                            $gt:new Date(getMonthEchats[i].start),
                            $lt:new Date(getMonthEchats[i].end)
                        }
                    }
                })
                for(let i = 0;i < orders.length;i++){
                    if(!arrayTrade_no.contains(orders[i].trade_no)){
                        arrayTrade_no.push(orders[i].trade_no)
                    }
                }
                for(let i = 0;i < orders.length;i++){
                    if(!foodId.contains(orders[i].FoodId)){
                        foodId.push(orders[i].FoodId)
                    }
                }
                for(let j = 0;j < foodId.length;j++){
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: foodId[j],
                            status:2,
                            createdAt: {
                                $lt: new Date(getMonthEchats[i].end),
                                $gte: new Date(getMonthEchats[i].start)
                            }
                        },
                        paranoid: false
                    })
                    let foodname = await Orders.findById(foodId[j])
                    let price = foodname.price*num
                    numprice=numprice+price
                }

                result.push({
                    numPrice:numprice,
                    numPeople:arrayTrade_no.length,
                    avgPrive:numprice/arrayTrade_no.length,
                    time:getMonthEchats[i].start
                })
            }
            return result;
        }

        if(type==3){
            let result = [];
            let arrayTrade_no=[];
            let foodId =[];
            let numprice = 0;
            let getQuarterEchats = await getQuarterEchats.getQuarter(startTime,endTime);
            for(let i = 0; i < getQuarterEchats.length; i++){
                let orders = await Orders.findAll({
                    where:{
                        tenantId:tenantId,
                        status:2,
                        createdAt:{
                            $gt:new Date(getQuarterEchats[i].start),
                            $lt:new Date(getQuarterEchats[i].end)
                        }
                    }
                })
                for(let i = 0;i < orders.length;i++){
                    if(!arrayTrade_no.contains(orders[i].trade_no)){
                        arrayTrade_no.push(orders[i].trade_no)
                    }
                }
                for(let i = 0;i < orders.length;i++){
                    if(!foodId.contains(orders[i].FoodId)){
                        foodId.push(orders[i].FoodId)
                    }
                }
                for(let j = 0;j < foodId.length;j++){
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: foodId[j],
                            status:2,
                            createdAt: {
                                $lt: new Date(getQuarterEchats[i].end),
                                $gte: new Date(getQuarterEchats[i].start)
                            }
                        },
                        paranoid: false
                    })
                    let foodname = await Orders.findById(foodId[j])
                    let price = foodname.price*num
                    numprice=numprice+price
                }
                result.push({
                    numPrice:numprice,
                    numPeople:arrayTrade_no.length,
                    avgPrive:numprice/arrayTrade_no.length,
                    time:getMonthEchats[i].start
                })
            }
            return result;
        }

        if(type==4){
            let result = [];
            let arrayTrade_no=[];
            let foodId =[];
            let numprice = 0;
            let getYearEchat = await getYearEchat.getYear(startTime,endTime);
            for(let i = 0; i < getYearEchat.length; i++){
                let orders = await Orders.findAll({
                    where:{
                        tenantId:tenantId,
                        status:2,
                        createdAt:{
                            $gt:new Date(getYearEchat[i].start),
                            $lt:new Date(getYearEchat[i].end)
                        }
                    }
                })
                for(let i = 0;i < orders.length;i++){
                    if(!arrayTrade_no.contains(orders[i].trade_no)){
                        arrayTrade_no.push(orders[i].trade_no)
                    }
                }
                for(let i = 0;i < orders.length;i++){
                    if(!foodId.contains(orders[i].FoodId)){
                        foodId.push(orders[i].FoodId)
                    }
                }
                for(let j = 0;j < foodId.length;j++){
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: foodId[j],
                            status:2,
                            createdAt: {
                                $lt: new Date(getYearEchat[i].end),
                                $gte: new Date(getYearEchat[i].start)
                            }
                        },
                        paranoid: false
                    })
                    let foodname = await Orders.findById(foodId[j])
                    let price = foodname.price*num
                    numprice=numprice+price
                }

                result.push({
                    numPrice:numprice,
                    numPeople:arrayTrade_no.length,
                    avgPrive:numprice/arrayTrade_no.length,
                    time:getMonthEchats[i].start
                })
            }
            return result;

        }

    }
    let instance = {
        getConsumption: getConsumption
    }
    return instance;
})();
module.exports = getConsumptionEchats;