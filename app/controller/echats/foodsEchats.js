const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let HotSaleFood = db.models.HotSaleFood;
let Foods = db.models.Foods;


const getFoodEchats = (function () {

    let getfEchats = async function (tenantId,startTime,endTime,type) {
        //type为1是日报表，2为月报表，3为周报表，4为季度报表，5为年报表
        if(new Date(startTime).getTime()>=new Date().getTime()){
            return "初始时间不能大于当前时间"
        }
        let FoodId=[];
        let result=[];
        if(type==1){
            for (let i = new Date(startTime).getTime(); i <= new Date(endTime).getTime(); i = i + 86400000) {
                orders = await Orders.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $lt: new Date(i+86400000),
                            $gte: new Date(i)
                        }
                    },
                    paranoid: false
                })
                for(let j=0;j<orders.length;j++){
                    if(!FoodId.contains(orders[i].foodId)){
                        FoodId.push(orders[i].foodId)
                    }
                }
                console.log(FoodId.length);
                for (let id of FoodId) {
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: id,
                            createdAt: {
                                $lt: new Date(i+86400000),
                                $gte: new Date(i)
                            }
                        },
                        paranoid: false
                    })
                    result.push({
                        time: new Date(i).format("yyyy-MM-dd"),
                        num: num
                    })
                }
                return result;
            }
        }
        if(type==2){
            //初试时间2017-2 - 2017-9
            //用结束的年份减去初始的年份相差的值
            //2017-2017=0
            let differenceYear = new Date(endTime).getYear()-new Date(startTime).getYear()
            //用结束的月份-初始的月份
            //9-2=7
            // let differenceMonth = new Date(endTime).getMonth()-new Date(startTime).getMonth();
            //将年份*12算出相差的月份+他们自身相差的月份得出相差的总月份
            //0*12+7相差7个月
            let differenceNumMonth = differenceYear*12
            let orders;
            //获得初始月份的值循环
            for (let i = new Date(startTime).getMonth(); i <= new Date(endTime).getMonth()+differenceNumMonth; i++) {
                let years = new Date(startTime).getFullYear();
                let stateDate = new Date(startTime)
                endDate.setHours(0,0,0)
                stateDate.setFullYear(i<=11?years:years+1,i,1);
                let endDate = new Date(startTime)
                endDate.setFullYear(i<11?years:years+1,i<11?i:i-11,0);
                endDate.setHours(23,59,59)
                orders = await Orders.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $lt: new Date(stateDate),
                            $gte: new Date(endDate)
                        }
                    },
                    paranoid: false
                })
                for(let j=0;j<orders.length;j++){
                    if(!FoodId.contains(orders[i].foodId)){
                        FoodId.push(orders[i].foodId)
                    }
                }
                console.log(FoodId.length);
                for (let id of FoodId) {
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: id,
                            createdAt: {
                                $lt: new Date(i+1),
                                $gte: new Date(i)
                            }
                        },
                        paranoid: false
                    })
                    result.push({
                        time: new Date(i).format("yyyy-MM-dd"),
                        num: num
                    })
                }
                return result;
            }
        }
        if(type==3){
            return "暂无数据";
        }
        if(type==4){
            //获取月份，月份从0开始所以当前月份要+1
            let month = new Date().getMonth();
            //获取季度，当前月份/3向下取余因为取上个月的所以获取月份时-1
            if(month==0){
                month.setFullYear(-1)
                month=12;
            }
            let quarter = Math.floor(month/3)
            for (let i = 1; i <=quarter; i++) {
                //季度算法初始月份
                let statusDays = new Date().setMonth((i-1)*3+1);
                //季度算法结束月份
                let endDays = new Date().setMonth(i*3);
                orders = await Orders.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $lt: new Date(endDays),
                            $gte: new Date(statusDays)
                        }
                    },
                    paranoid: false
                })
                for(let j=0;j<orders.length;j++){
                    if(!FoodId.contains(orders[i].foodId)){
                        FoodId.push(orders[i].foodId)
                    }
                }
                console.log(FoodId.length);
                for (let id of FoodId) {
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: id,
                            createdAt: {
                                $lt: new Date(endDays),
                                $gte: new Date(statusDays)
                            }
                        },
                        paranoid: false
                    })
                    result.push({
                        time: new Date(i).format("yyyy-MM-dd"),
                        num: num
                    })
                }
                return result;
            }

        }
        //年份报表
        if(type==5){
            //设置初始时间为如初试时间为2015年到2017年的报表，这就要求写2015年1月1日凌晨1时间到2015年12月31日23.59分的所有资料
            let startTimes = new Date(startTime)
            startTimes.setFullYear(new Date(startTime).getFullYear(),0,1);
            startTimes.setHours(0,0,0);
            let endTimes = new Date(startTime);
            endTimes.setFullYear(new Date(startTime).getFullYear(),11,31)
            endTimes.format("yyyy-MM-dd 23:59:59");

            for (let i = startTime.getFullYear(); i <=new Date(endTime).getFullYear(); i++) {
                //季度算法初始月份
                let startTimes = new Date(i)
                startTimes.setFullYear(i,0,1)
                startTimes.setHours(0,0,0);
                let endTimes = new Date(i);
                endTimes.setFullYear(i,11,31)
                endTimes.setHours(23,59,59);
                orders = await Orders.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $lt: new Date(endTimes),
                            $gte: new Date(startTimes)
                        }
                    },
                    paranoid: false
                })
                for(let j=0;j<orders.length;j++){
                    if(!FoodId.contains(orders[i].foodId)){
                        FoodId.push(orders[i].foodId)
                    }
                }
                console.log(FoodId.length);
                for (let id of FoodId) {
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: id,
                            createdAt: {
                                $lt: new Date(endTimes),
                                $gte: new Date(startTimes)
                            }
                        },
                        paranoid: false
                    })
                    result.push({
                        time: new Date(i).format("yyyy-MM-dd"),
                        num: num
                    })
                }
                return result;
            }
        }
    }
    let instance = {
        getfEchats: getfEchats
    }
    return instance;
})();
module.exports = getFoodEchats;