
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Coupons = db.models.Coupons;
let getMonthEchats = require('../echats/MonthEchats')
let getQuarterEchats = require('../echats/quarterEchats')
let getYearEchat = require('../echats/yearEchat')

const getCouponsEchats = (function () {
    let getCoupons = async function (tenantId,startTime,endTime,type) {
        if(type==1){
            let result=[];
            //startTime开始时间
            //endTime结束时间
            const oneDay = 24*60*60*1000;

            for(let i=new Date(startTime).getTime();i<new Date(endTime).getTime();i+=oneDay){
                //当天tenantId的所有记录
                let coupons = await Coupons.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gte:new Date(i),
                            $lt:new Date(i+oneDay)
                        },
                        status:1
                    }
                })
                let time = new Date(i);
                time.setDate(time.getDate()+1)
                let times = time.format("yyyy-MM-dd 0:0:0");
                result.push({
                    couponsCount:coupons.length,
                    time:times
                })
            }
            return result;
        }
        if(type==2){
            let result=[];
            let MonthEchats = await getMonthEchats.getMonth(startTime,endTime)
            for (let i =0;i<MonthEchats.length;i++){
                let coupons = await Coupons.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gte:new Date(MonthEchats[i].start),
                            $lt:new Date(MonthEchats[i].end)
                        },
                        status:1
                    }
                })
                // let time = new Date(i);
                // time.setDate(time.getDate()+1)
                // let times = time.format("yyyy-MM-dd 0:0:0");
                result.push({
                    couponsCount:coupons.length,
                    time:MonthEchats[i].start
                })
            }
            return result;

        }
        if(type==3){
            let result=[];
            let Quaeter = getQuarterEchats.getQuarter(startTime,endTime);
            for(let i = 0;i <Quaeter.length; i++){
                let coupons = await Coupons.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gte:new Date(Quaeter[i].start),
                            $lt:new Date(Quaeter[i].end)
                        },
                        status:1
                    }
                })
                let startDate = Quaeter[i].start
                let year = parseInt(startDate.substring(0,4))
                let time = parseInt(startDate.substring(5,6));
                console.log(time)
                let quaeters = (time+2)/3

                result.push({
                    couponsCount:coupons.length,
                    time:year+"年第"+quaeters+"季度"
                })
            }
            return result;
        }
        if(type==4){
            let result=[];
            let years = getYearEchat.getYear(startTime,endTime);
            for(let i = 0;i <years.length; i++){
                let coupons = await Coupons.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gte:new Date(years[i].start),
                            $lt:new Date(years[i].end)
                        },
                        status:1
                    }
                })
                let startDate = years[i].start
                let year = parseInt(startDate.substring(0,4))

                result.push({
                    couponsCount:coupons.length,
                    time:year+"年"
                })
            }
            return result;
        }



    }
    let instance = {
        getCoupons: getCoupons
    }
    return instance;
})();
module.exports = getCouponsEchats;
