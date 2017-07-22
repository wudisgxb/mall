
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Vips = db.models.Vips;
let Foods = db.models.Foods;
let getFindCount = require('../echats/findCountAll')
let getMonthEchats = require('../echats/MonthEchats')
let getQuarterEchats = require('../echats/quarterEchats')
let getYearEchat = require('../echats/yearEchat')

//会员按时间段增长的数据
const getVipEchats = (function () {
    let getVip = async function (tenantId,startTime,endTime,type) {
        //type为1是每日会员增长数，2每月会员增长数，3为每季度会员增长数，5为每年会员增长数
        if(type==1){
            let result=[];
            //startTime开始时间
            //endTime结束时间
            const oneDay = 24*60*60*1000;
            for(let i=new Date(startTime).getTime();i<new Date(endTime).getTime();i+=oneDay){
                const vips = await Vips.findAndCountAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt:new Date(i),
                            $lt:new Date(i+oneDay)
                        }
                    }
                });
                result.push({
                    name:"当日会员增长",
                    count : vips.count,
                    time : new Date(i)
                });
            }
            return result;
        }

        if(type==3){
            // //1.将开始时间和结束时间(譬如2016-10和2017-4)相差的值转换成数组
            // //数组[{"start":"2016-10","end":"2016-11"},{"start":"2016-11","end":"2016-12"}，.....]
            // //2.循环遍历数组每一项的会员数
            // //2016
            // let startDate = parseInt(startTime.substring(0,4))
            // //10
            // let startMonth = parseInt(startTime.substring(5))//10
            // let endDate =  parseInt(endTime.substring(0,4))
            // let endMonth =  parseInt(endTime.substring(5))//4
            // let differDates = (endDate-startDate)*12;
            // let differDate = differDates+endMonth;
            // // let differMonth = differDate-startMonth;
            // let eeeee=[];
            // let aaa=startDate
            // for(let i=startMonth;i<differDate;i++){
            //     let startDates = i;
            //     let endDates =startDates+1
            //     if(i>10){
            //         endDates=endDates%12==0?12:endDates%12;
            //     }
            //     if(i%12==0){
            //         aaa=aaa+1
            //     }
            //     if(i % 12==1){
            //         startDate = startDate+1
            //     }
            //     if(i>12){
            //         startDates = startDates%12==0?12:startDates%12;
            //     }
            //     let start =startDate+"-"+startDates
            //     let end =aaa+"-"+endDates
            //     eeeee.push({
            //         start:start,
            //         end:end
            //     })
            // }
            // console.log("------------")
            // console.log(eeeee)
            // console.log("------------")
            let eeeee =  getMonthEchats.getMonth(startTime,endTime);
            let result=[];
            for(let j=0;j<eeeee.length;j++){
                let vips=[];
                vips = await Vips.findAll({
                    where:{
                        createdAt:{
                            $gt:new Date(eeeee[j].start),
                            $lt:new Date(eeeee[j].end)
                        },
                        tenantId:tenantId,
                    },
                    paranoid: false
                });
                result.push({
                    name:"vip增长情况",
                    count:vips.length,
                    time:eeeee[j].start
                })

            }
            return result;
        }

        if(type==2){
            let ccccc = await getQuarterEchats.getQuarter(startTime,endTime);
            let result = [];
            for(let i = 0;i<ccccc.length;i++){
                let vips=[];
                vips = await Vips.findAll({
                    where:{
                        createdAt:{
                            $gt:new Date(ccccc[i].start),
                            $lt:new Date(ccccc[i].end)
                        },
                        tenantId:tenantId,
                    },
                    paranoid: false
                });
                //季度为月份/3向下取余+1
                let startYear = parseInt(ccccc[i].start.substring(0,4))
                let startDates = (parseInt(ccccc[i].start.substring(5))+2)/3
                console.log(parseInt(ccccc[i].start.substring(5))+2);
                result.push({
                    name:"vip增长情况",
                    count:vips.length,
                    time:startYear+"第"+startDates+"季度"
                })
            }
            return result;

            // //根据季度做报表
            // //传过来的参数20172截取前四位得到年的数据
            // let startYear = startTime.substring(0,4)
            // //将年转换成int类型
            // let startIntYear = parseInt(startYear)
            // //截取季度值
            // let startQuarter = parseInt(startTime.substring(4,5))
            // //结束的季度同上
            // let endYear = endTime.substring(0,4)
            //
            // let endIntYear = parseInt(endYear)
            // let endQuarter = parseInt(endTime.substring(4,5))
            // //判断起始季度对应的起始月份1季度1-3月
            // let startMonth = (startQuarter-1)*3
            // //判断结束季度对应的开始月份
            // let endMonth = (endQuarter-1)*3
            // //输入开始季度的开始时间
            // let startDate = new Date();
            // startDate.setFullYear(startIntYear,startMonth,2)
            // let startDateTime = startDate.format("yyyy-MM-dd 00:00:00");
            // //结束的开始时间
            // let endDate = new Date();
            // endDate.setFullYear(endIntYear,endMonth,2)
            // let endDateTime = endDate.format("yyyy-MM-dd 00:00:00");
            // let vips=[];
            // let result=[];
            // for (let i = new Date(startDateTime);i<=new Date(endDateTime);){
            //     console.log(2222)
            //     let end = new Date(i);
            //     end.setMonth(4);
            //     end.setDate(0);
            //     let endQuarterDate = end.format("yyyy-MM-dd 23:59:59");
            //     vips = await Vips.findAndCountAll({
            //         where:{
            //             tenantId:tenantId,
            //             createdAt:{
            //                 $gt:new Date(i),
            //                 $lt:new Date(endQuarterDate)
            //             }
            //         },
            //         paranoid: false
            //     });
            //     result.push({
            //         name : "当前季度会员增长量",
            //         count : vips.count,
            //         time:i
            //     });
            // }
            // return result;
        }

        if(type==4){
            let sss = await getYearEchat.getYear(startTime,endTime)
            let result = [];
            for(let i = 0;i<sss.length;i++){
                let vips=[];
                vips = await Vips.findAll({
                    where:{
                        createdAt:{
                            $gt:new Date(sss[i].start),
                            $lt:new Date(sss[i].end)
                        },
                        tenantId:tenantId,
                    },
                    paranoid: false
                });
                let startYear = parseInt(sss[i].start.substring(0,4))
                result.push({
                    name:"vip增长情况",
                    count:vips.length,
                    time:startYear+"年"
                })
            }
            return result;


            // let startDate = new Date(startTime);
            // let endDate = new Date(endTime);
            // let vips=[];
            // let result=[];
            // for(let i = new Date(startDate);i<new Date(endDate);i.setFullYear(i.getFullYear()+1)){
            //     let EndD = new Date(i);
            //     EndD.setFullYear(i.getFullYear()+1);
            //     EndD.setDate(0);
            //     let endYears = EndD.format("yyyy-MM-dd 23:59:59");
            //     vips = await Vips.findAndCountAll({
            //         where:{
            //             tenantId:tenantId,
            //             createdAt:{
            //                 $gt:new Date(i),
            //                 $lt:new Date(endYears)
            //             }
            //         },
            //         paranoid: false
            //     });
            //     result.push({
            //         name : "当前年度会员增长量",
            //         count : vips.count,
            //         time:new Date(startTime)
            //     });
            // }
            // console.log(startDate);
            // return result;
        }

    }
    let instance = {
        getVip: getVip
    }
    return instance;
})();
module.exports = getVipEchats;