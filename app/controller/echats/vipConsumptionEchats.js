const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let Vips = db.models.Vips;
let Foods = db.models.Foods;

let getFindCount = require('../echats/findCountAll')
let getMonthEchats = require('../echats/MonthEchats')
let getQuarterEchats = require('../echats/quarterEchats')
let getYearEchat = require('../echats/yearEchat')

const getVipConsumptionEchats = (function () {
    let getVipConsumption = async function (tenantId,startTime,endTime,type) {
        //type==1每日会员平均消费，type==2每月会员平均消费,type==3每季度会员平均消费,type==4每年会员平均消费
        if(type==1){
            let result=[];
            //startTime开始时间
            //endTime结束时间
            const oneDay = 24*60*60*1000;
            let arrayPhone = [];
            let vipPhone = [];
            let foodId = [];
            let numprice=0;
            let OrderByVip=[];
            for(let i=new Date(startTime).getTime();i<new Date(endTime).getTime();i+=oneDay){
                //当天tenantId的所有记录
                let orders = await Orders.findAll({
                    where:{
                        status:2,
                        tenantId:tenantId,
                        createdAt:{
                            $gt:new Date(i),
                            $lt:new Date(i+oneDay)
                        }
                    }
                })
                //查询是vip的电话
                for (let j=0;j<orders.length;j++){
                    let vip = await Vips.findOne({
                        phone:orders[j].phone
                    })
                    if(vip!=null){
                       //查询order中的num和food表中的id
                        //查询FoodId
                        let orderFind = await Orders.FindAll({
                            where:{
                                phone:vip.Phone,
                                createdAt:{
                                    $gt:new Date(i),
                                    $lt:new Date(i+oneDay)
                                },
                                status:2
                            }
                        })

                        //查询不重复的FoodId
                        //
                        for(let k=0;k<orderFind.length;i++){
                            vipPhone.push(orderFind[k].phone)
                            if(!foodId.contains(orderFind[k].FoodId)){
                                foodId.push(orderFind[k].FoodId)
                            }
                        }
                    }
                }

                for(let l = 0;l<foodId.length;l++){
                    //根据foodId查询num数量
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: foodId[l],
                            createdAt: {
                                $lt: new Date(i+oneDay),
                                $gte: new Date(i)
                            }
                        },
                        paranoid: false
                    })
                    let food = await Orders.findOne({
                        where: {
                            FoodId: foodId[l],
                            createdAt: {
                                $lt: new Date(i+oneDay),
                                $gte: new Date(i)
                            }
                        },
                        paranoid: false
                    })
                    numprice+=food.vipPrice*num
                }
                result.push({
                    numPrice:numprice,
                    avgPrive:Math.round(numprice*100/vipPhone.length)/100,
                    time:i
                })
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