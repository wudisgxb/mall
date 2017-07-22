
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let Foods = db.models.Foods;
let GetMonthEchats = require('../echats/MonthEchats')
let GetQuarterEchats = require('../echats/quarterEchats')
let GetYearEchat = require('../echats/yearEchat')


const getConsumptionEchats = (function () {
    let getConsumption = async function (tenantId,startTime,endTime,type) {
        //type=1为每日平均消费多少元，type==2为每月消费，type==3为每季度消费。type==4为每年消费
        if(type==1){
            let result=[];
            //startTime开始时间
            //endTime结束时间
            const oneDay = 24*60*60*1000;



            for(let i=new Date(startTime).getTime();i<new Date(endTime).getTime();i+=oneDay){
                let arrayTrade_no = [];
                let foodId = [];
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
                for(let k = 0;k < orders.length;k++){
                    if(!arrayTrade_no.contains(orders[k].trade_no)){
                        arrayTrade_no.push(orders[k].trade_no)
                    }
                }
                console.log(arrayTrade_no.length)
                for(let l = 0;l < orders.length;l++){
                    if(!foodId.contains(orders[l].FoodId)){
                        foodId.push(orders[l].FoodId)
                    }
                }
                console.log(foodId.length)
                let numprice=0;
                //foodId.length==2
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
                    console.log(foodId[j]+"菜的数量")
                    console.log(num)
                    let foodname = await Foods.findById(foodId[j])
                    console.log("当前菜的单价")
                    console.log(foodname.price)
                    let price = foodname.price*num
                    console.log("当前菜的总价")
                    console.log(price)
                    numprice=numprice+price

                    console.log("累加当日的价格")
                    console.log(numprice)
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

        if(type==3){
            let result = [];
            let getMonthEchats = await GetMonthEchats.getMonth(startTime,endTime);
            for(let i = 0; i < getMonthEchats.length; i++){
                let arrayTrade_no = [];
                let foodId = [];
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
                console.log("---------")
                console.log(orders.length)
                for(let k = 0;k < orders.length;k++){
                    if(!arrayTrade_no.contains(orders[k].trade_no)){
                        arrayTrade_no.push(orders[k].trade_no)
                    }
                }
                console.log(arrayTrade_no.length)
                for(let l = 0;l < orders.length;l++){
                    if(!foodId.contains(orders[l].FoodId)){
                        foodId.push(orders[l].FoodId)
                    }
                }
                console.log(foodId.length)
                let numprice=0;
                //foodId.length==2
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
                    console.log(foodId[j]+"菜的数量")
                    console.log(num)
                    let foodname = await Foods.findById(foodId[j])
                    console.log("当前菜的单价")
                    console.log(foodname.price)
                    let price = foodname.price*num
                    console.log("当前菜的总价")
                    console.log(price)
                    numprice=numprice+price

                    console.log("累加当日的价格")
                    console.log(numprice)
                }

                result.push({
                    numPrice:numprice,
                    numPeople:arrayTrade_no.length,
                    avgPrive:numprice/arrayTrade_no.length,
                    time:new Date(getMonthEchats[i].start)
                })
            }
            return result;
        }

        if(type==2){
            let result = [];

            let getQuarterEchats = await GetQuarterEchats.getQuarter(startTime,endTime);
            for(let i = 0; i < getQuarterEchats.length; i++){
                let arrayTrade_no = [];
                let foodId = [];
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
                console.log("---------")
                console.log(orders.length)
                for(let k = 0;k < orders.length;k++){
                    if(!arrayTrade_no.contains(orders[k].trade_no)){
                        arrayTrade_no.push(orders[k].trade_no)
                    }
                }
                console.log(arrayTrade_no.length)
                for(let l = 0;l < orders.length;l++){
                    if(!foodId.contains(orders[l].FoodId)){
                        foodId.push(orders[l].FoodId)
                    }
                }
                console.log(foodId.length)
                let numprice=0;
                //foodId.length==2
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
                    console.log(foodId[j]+"菜的数量")
                    console.log(num)
                    let foodname = await Foods.findById(foodId[j])
                    console.log("当前菜的单价")
                    console.log(foodname.price)
                    let price = foodname.price*num
                    console.log("当前菜的总价")
                    console.log(price)
                    numprice=numprice+price

                    console.log("累加当日的价格")
                    console.log(numprice)
                }
                let year = parseInt(getQuarterEchats[i].start.substring(0,4));
                let month = parseInt(getQuarterEchats[i].start.substring(5,6));
                let quarter = (month+2)/3


                result.push({
                    numPrice:numprice,
                    numPeople:arrayTrade_no.length,
                    avgPrive:numprice/arrayTrade_no.length,
                    time:year+"年第"+quarter+"季度"
                })
            }
            return result;
        }

        if(type==4){
            let result = [];
            let getYearEchat = await GetYearEchat.getYear(startTime,endTime);
            for(let i = 0; i < getYearEchat.length; i++){
                let arrayTrade_no = [];
                let foodId = [];
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
                console.log("---------")
                console.log(orders.length)
                for(let k = 0;k < orders.length;k++){
                    if(!arrayTrade_no.contains(orders[k].trade_no)){
                        arrayTrade_no.push(orders[k].trade_no)
                    }
                }
                console.log(arrayTrade_no.length)
                for(let l = 0;l < orders.length;l++){
                    if(!foodId.contains(orders[l].FoodId)){
                        foodId.push(orders[l].FoodId)
                    }
                }
                console.log(foodId.length)
                let numprice=0;
                //foodId.length==2
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
                    console.log(foodId[j]+"菜的数量")
                    console.log(num)
                    let foodname = await Foods.findById(foodId[j])
                    console.log("当前菜的单价")
                    console.log(foodname.price)
                    let price = foodname.price*num
                    console.log("当前菜的总价")
                    console.log(price)
                    numprice=numprice+price

                    console.log("累加当日的价格")
                    console.log(numprice)
                }
                let year = parseInt(getYearEchat[i].start.substring(0,4));


                result.push({
                    numPrice:numprice,
                    numPeople:arrayTrade_no.length,
                    avgPrive:numprice/arrayTrade_no.length,
                    time:year+"年"
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