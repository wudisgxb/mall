const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Orders = db.models.Orders;
let Vips = db.models.Vips;
let PaymentHistory = db.models.PaymentHistory;
let GetQuarterEchats = require('../echats/quarterEchats')
let getFindCount = require('../echats/findCountAll')
let GetMonthEchats = require('../echats/MonthEchats')
let GetYearEchat = require('../echats/yearEchat')

const getPaymentHistoryEchats = (function () {
    let getPaymentHistory = async function (tenantId,startTime,EndTime,type) {
        if(type==1){
           let orderJson = {};
           let result =[];
           let oneDay = 24*60*60*1000
           for(let i = new Date(startTime).getTime();i<new Date(EndTime).getTime();i+=oneDay){
                let paymentHistory = await PaymentHistory.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt:new Date(i),
                            $lt:new Date(i+oneDay)
                        }
                    }
                })
                for(let j = 0;j<paymentHistory.length;j++){
                    orderJson=[];
                    orderJson[j].grossIncome = paymentHistory[j].grossIncome;
                    orderJson[j].merchantDiscount = paymentHistory[j].merchantDiscount;
                    orderJson[j].platformFee = paymentHistory[j].platformFee;
                    orderJson[j].platformDiscount = paymentHistory[j].platformDiscount;
                    orderJson[j].businessRealIncome = paymentHistory[j].businessRealIncome;
                    orderJson[j].customerPaymentPrice = paymentHistory[j].customerPaymentPrice;
                }
               result.push(orderJson)
           }
           return result;
       }

        if(type==2){
            let orderJson = {};
            let result =[];
            let getMonth = GetMonthEchats.getMonth(startTime,EndTime)
            for (let i = 0; i<getMonth.length;i++){
                let paymentHistory = await PaymentHistory.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt:new Date(getMonth[i].start),
                            $lt:new Date(getMonth[i].end)
                        }
                    }
                })
                for(let j = 0;j<paymentHistory.length;j++){
                    orderJson=[];
                    orderJson[j].grossIncome = paymentHistory[j].grossIncome;
                    orderJson[j].merchantDiscount = paymentHistory[j].merchantDiscount;
                    orderJson[j].platformFee = paymentHistory[j].platformFee;
                    orderJson[j].platformDiscount = paymentHistory[j].platformDiscount;
                    orderJson[j].businessRealIncome = paymentHistory[j].businessRealIncome;
                    orderJson[j].customerPaymentPrice = paymentHistory[j].customerPaymentPrice;
                }
                result.push(orderJson)
            }
            return result;
        }

        if(type==3){
            let orderJson = {};
            let result =[];
            let getYear = GetYearEchat.getYear(startTime,endTime);
            for (let i = 0;i<getYear.length;i++){
                let paymentHistory = await PaymentHistory.findAll({
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt:new Date(getYear[i].start),
                            $lt:new Date(getYear[i].end)
                        }
                    }
                })
                for(let j = 0;j<paymentHistory.length;j++){
                    orderJson=[];
                    orderJson[j].grossIncome = paymentHistory[j].grossIncome;
                    orderJson[j].merchantDiscount = paymentHistory[j].merchantDiscount;
                    orderJson[j].platformFee = paymentHistory[j].platformFee;
                    orderJson[j].platformDiscount = paymentHistory[j].platformDiscount;
                    orderJson[j].businessRealIncome = paymentHistory[j].businessRealIncome;
                    orderJson[j].customerPaymentPrice = paymentHistory[j].customerPaymentPrice;
                }
                result.push(orderJson)
            }
            return result;
        }


    }
    let instance = {
        getPaymentHistory: getPaymentHistory
    }
    return instance;
})();
module.exports = getPaymentHistoryEchats;
