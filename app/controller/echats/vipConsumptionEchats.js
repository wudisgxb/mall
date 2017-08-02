const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let Vips = db.models.Vips;
let Foods = db.models.Foods;
let GetQuarterEchats = require('../echats/quarterEchats')

let getFindCount = require('../echats/findCountAll')
let GetMonthEchats = require('../echats/MonthEchats')
let GetYearEchat = require('../echats/yearEchat')

const getVipConsumptionEchats = (function () {
    let getVipConsumption = async function (tenantId,startTime,endTime,type) {
        //type==1每日会员平均消费，type==2每月会员平均消费,type==3每季度会员平均消费,type==4每年会员平均消费
        if(type==1){
            let result=[];

            const oneDay = 24*60*60*1000;

            for(let i=new Date(startTime).getTime();i<new Date(endTime).getTime();i+=oneDay){
                let vipPhone = [];
                let vipsPhone=[];
                let foodId = [];
                let numprice=0;
                //当天tenantId的所有记录
                let orders = await Orders.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt:new Date(i),
                            $lt:new Date(i+oneDay)
                        },
                        status:2,
                    },
                    paranoid: false
                })
                // console.log(orders.length)
                //查询是vip的电话
                for (let j=0;j<orders.length;j++){
                    let vip = await Vips.findOne({
                        where:{
                            phone:orders[j].phone
                        }

                    })
                    if(vip!=null){
                        vipPhone.push(orders[j].phone)
                        let orderFind = await Orders.findAll({
                            where:{
                                phone:vip.phone,
                                createdAt:{
                                    $gt:new Date(i),
                                    $lt:new Date(i+oneDay)
                                },
                                status:2
                            },
                            paranoid: false
                        })
                        //查询不重复的FoodId
                        //
                        for(let k=0;k<orderFind.length;k++){
                            if(!foodId.contains(orderFind[k].FoodId)){
                                foodId.push(orderFind[k].FoodId)
                            }
                        }

                    }
                }
                // console.log("2222222")
                for(let x=0;x<vipPhone.length;x++){
                    // console.log(vipPhone[x])
                    if(!vipsPhone.contains(vipPhone[x])){
                        vipsPhone.push(vipPhone[x])
                    }
                }
                // console.log("33333")
                for(let l = 0;l<foodId.length;l++){
                    //根据foodId查询num数量
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: foodId[l],
                            createdAt: {
                                $lt: new Date(i+oneDay),
                                $gt: new Date(i)
                            },
                            status:2
                        },
                        paranoid: false
                    })
                    // console.log(num)
                    let food = await Foods.findOne({
                        where: {
                            id: foodId[l]
                        },
                        paranoid: false
                    })
                    // console.log(food==null)
                    numprice+=food.vipPrice*num
                }
                result.push({
                    numPrice:numprice,
                    numpeople:vipsPhone.length,
                    avgPrive:Math.round(numprice*100/vipsPhone.length)/100,
                    time:i
                })
            }
            return result;
        }

        if(type==2){
            let result = [];

            let getQuarterEchats = await GetQuarterEchats.getQuarter(startTime,endTime);
            for(let i = 0; i < getQuarterEchats.length; i++){
                let vipPhone = [];
                let vipsPhone=[];
                let foodId = [];
                let numprice=0;
                //当天tenantId的所有记录
                let orders = await Orders.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt:new Date(getQuarterEchats[i].start),
                            $lt:new Date(getQuarterEchats[i].end)
                        },
                        status:2,
                    },
                    paranoid: false
                })
                // console.log(orders.length)
                //查询是vip的电话
                for (let j=0;j<orders.length;j++){
                    let vip = await Vips.findOne({
                        where:{
                            phone:orders[j].phone
                        }

                    })
                    if(vip!=null){
                        vipPhone.push(orders[j].phone)
                        let orderFind = await Orders.findAll({
                            where:{
                                phone:vip.phone,
                                createdAt:{
                                    $gt:new Date(getQuarterEchats[i].start),
                                    $lt:new Date(getQuarterEchats[i].end)
                                },
                                status:2
                            },
                            paranoid: false
                        })
                        //查询不重复的FoodId
                        //
                        for(let k=0;k<orderFind.length;k++){
                            if(!foodId.contains(orderFind[k].FoodId)){
                                foodId.push(orderFind[k].FoodId)
                            }
                        }

                    }
                }
                // console.log("2222222")
                for(let x=0;x<vipPhone.length;x++){
                    // console.log(vipPhone[x])
                    if(!vipsPhone.contains(vipPhone[x])){
                        vipsPhone.push(vipPhone[x])
                    }
                }
                // console.log("33333")
                for(let l = 0;l<foodId.length;l++){
                    //根据foodId查询num数量
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: foodId[l],
                            createdAt: {
                                $lt: new Date(i+oneDay),
                                $gt: new Date(i)
                            },
                            status:2
                        },
                        paranoid: false
                    })
                    // console.log(num)
                    let food = await Foods.findOne({
                        where: {
                            id: foodId[l]
                        },
                        paranoid: false
                    })
                    // console.log(food==null)
                    numprice+=food.vipPrice*num
                }
                result.push({
                    numPrice:numprice,
                    numpeople:vipsPhone.length,
                    avgPrive:Math.round(numprice*100/vipsPhone.length)/100,
                    time:i
                })
            }
            return result;
        }

        if(type==3){
            let result = [];
            let getMonthEchats = await GetMonthEchats.GetMonth(startTime,endTime);
            for(let i = 0; i < getMonthEchats.length; i++){
                let vipPhone = [];
                let vipsPhone=[];
                let foodId = [];
                let numprice=0;
                //当天tenantId的所有记录
                let orders = await Orders.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt:new Date(getMonthEchats[i].start),
                            $lt:new Date(getMonthEchats[i].end)
                        },
                        status:2,
                    },
                    paranoid: false
                })
                // console.log(orders.length)
                //查询是vip的电话
                for (let j=0;j<orders.length;j++){
                    let vip = await Vips.findOne({
                        where:{
                            phone:orders[j].phone
                        }

                    })
                    if(vip!=null){
                        vipPhone.push(orders[j].phone)
                        let orderFind = await Orders.findAll({
                            where:{
                                phone:vip.phone,
                                createdAt:{
                                    $gt:new Date(getMonthEchats[i].start),
                                    $lt:new Date(getMonthEchats[i].end)
                                },
                                status:2
                            },
                            paranoid: false
                        })
                        //查询不重复的FoodId
                        //
                        for(let k=0;k<orderFind.length;k++){
                            if(!foodId.contains(orderFind[k].FoodId)){
                                foodId.push(orderFind[k].FoodId)
                            }
                        }

                    }
                }
                // console.log("2222222")
                for(let x=0;x<vipPhone.length;x++){
                    // console.log(vipPhone[x])
                    if(!vipsPhone.contains(vipPhone[x])){
                        vipsPhone.push(vipPhone[x])
                    }
                }
                // console.log("33333")
                for(let l = 0;l<foodId.length;l++){
                    //根据foodId查询num数量
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: foodId[l],
                            createdAt: {
                                $lt: new Date(i+oneDay),
                                $gt: new Date(i)
                            },
                            status:2
                        },
                        paranoid: false
                    })
                    // console.log(num)
                    let food = await Foods.findOne({
                        where: {
                            id: foodId[l]
                        },
                        paranoid: false
                    })
                    // console.log(food==null)
                    numprice+=food.vipPrice*num
                }
                result.push({
                    numPrice:numprice,
                    numpeople:vipsPhone.length,
                    avgPrive:Math.round(numprice*100/vipsPhone.length)/100,
                    time:i
                })
            }
            return result;
        }

        if(type==4){
            let result = [];
            let getYearEchat = await GetYearEchat.GetYear(startTime,endTime);
            for(let i = 0; i < getYearEchat.length; i++){
                let OrderEchats = await OrderEchats.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt:new Date(getYearEchat[i].start),
                            $lt:new Date(getYearEchat[i].end)
                        },
                        paranoid: false
                    }
                })
                for (let j = 0;j<OrderEchats.length;j++){
                    result.push({
                        vipNum:OrderEchats[j].vipNum,
                        vipPrice:OrderEchats[j].vipPrice,
                        time:new Date(getYearEchat[i].start)
                    })
                }
            }
            return result;
        }

    }
    let instance = {
        getVipConsumption: getVipConsumption
    }
    return instance;
})();
module.exports = getVipConsumptionEchats;