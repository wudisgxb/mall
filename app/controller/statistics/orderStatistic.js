const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/statisticsMySql/index');
let dbv3 = require('../../db/Mysql/index')

let StatisticsOrders = db.models.Orders;
let Vips = dbv3.models.Vips;

let getDayEchat = require('../echats/dayEchat')
let getMonthEchats = require('../echats/MonthEchats')
let getQuarterEchats = require('../echats/quarterEchats')
let getYearEchat = require('../echats/yearEchat')

const getstatistics = (function () {
    // 设置Order表
    let setOrders = async function (json) {
        await StatisticsOrders.create({
            trade_no:json.trade_no,
            totalPrice:json.totalPrice,
            merchantAmount:json.merchantAmount,
            consigneeAmount:json.consigneeAmount,
            platformAmount:json.platformAmount,
            deliveryFee:json.deliveryFee,
            refund_amount:json.refund_amount,
            platformCouponFee:json.platformCouponFee,
            merchantCouponFee:json.merchantCouponFee,
            phone:json.phone,
        })
    }
    // 查询平均消费
    let getAvgConsumption = async function (tenantId,startTime,endTime,type) {
        //type==1为每日平均消费
        if(type==1){
            let result=[];
            let oneDay = 24*60*60*1000

            for (let i = new Date(startTime).getTime();i<new Date(endTime).getTime();i+=oneDay){
                let numPrice =0;
                let consumption = await StatisticsOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt : new Date(i),
                            $lt : new Date(i+oneDay)
                        }
                    },
                })
                for(let j = 0; j < consumption.length; j++){
                    numPrice = consumption[j].totalPrice+numPrice
                }
                result.push({
                    numPrice : numPrice,
                    property : consumption.length,
                    AvgConsumption : numPrice/consumption.length
                })
            }
            return result;
        }
        // 每月平均消费
        if(type==2){
            let result = [];
            let getMonthEchats = await getMonthEchats.getMonth(startTime,endTime);
            for (let i = 0; i < getMonthEchats.length; i++){
                let numPrice =0;
                let consumption = await StatisticsOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt : new Date(getMonthEchats[i].start),
                            $lt : new Date(getMonthEchats[i].end)
                        }
                    },
                })
                for(let j = 0; j < consumption.length; j++){
                    numPrice = consumption[j].totalPrice+numPrice
                }
                result.push({
                    numPrice : numPrice,
                    property : consumption.length,
                    AvgConsumption : numPrice/consumption.length
                })
            }
            return result;
        }
        //每季度平均消费
        if(type==3){
            let result = [];
            let getQuarterEchats = await getQuarterEchats.getQuarter(startTime,endTime);
            for (let i = 0; i < getQuarterEchats.length; i++){
                let numPrice =0;
                let consumption = await StatisticsOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt : new Date(getQuarterEchats[i].start),
                            $lt : new Date(getQuarterEchats[i].end)
                        }
                    },
                })
                for(let j = 0; j < consumption.length; j++){
                    numPrice = consumption[j].totalPrice+numPrice
                }
                result.push({
                    numPrice : numPrice,
                    property : consumption.length,
                    AvgConsumption : numPrice/consumption.length
                })
            }
            return result;
        }
        //每年平均消费
        if(type==4){
            let result = [];
            let getYearEchat = await getYearEchat.getYear(startTime,endTime);
            for (let i = 0; i < getYearEchat.length; i++){
                let numPrice =0;
                let consumption = await StatisticsOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt : new Date(getYearEchat[i].start),
                            $lt : new Date(getYearEchat[i].end)
                        }
                    },
                })
                for(let j = 0; j < consumption.length; j++){
                    numPrice = consumption[j].totalPrice+numPrice
                }
                result.push({
                    numPrice : numPrice,
                    property : consumption.length,
                    AvgConsumption : numPrice/consumption.length
                })
            }
            return result;
        }

    }
    // 查询vip平均消费
    let getVipAvgConsumption = async function (tenantId,startTime,endTime,type) {
        if(type==1){
            let result = [];
            let getDayEchat = await getDayEchat.getDay(startTime,endTime);
            for (let i = 0; i < getDayEchat.length; i++){
                let vipPhone = [];
                let numPrice =0;
                let consumption = await StatisticsOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt : new Date(getDayEchat[i].start),
                            $lt : new Date(getDayEchat[i].end)
                        }
                    },
                })
                for (let j = 0;j < consumption.length; j++){
                    let vips = await Vips.findOne({
                        where:{
                            phone:consumption[j].phone
                        }
                    })
                    if(vips!=null){
                        vipPhone.push(vips.phone)
                    }
                }
                for (let k = 0; k < vipPhone.length; k++){
                    let statisticsOrders = await StatisticsOrders.findOne({
                        where:{
                            tenantId : tenantId,
                            createdAt : {
                                $gt : new Date(getDayEchat[i].start),
                                $lt : new Date(getDayEchat[i].end)
                            },
                            phone : vipPhone[k]
                        }
                    })
                    numPrice+=statisticsOrders[k].totalPrice
                }
                result.push({
                    numPrice : numPrice,
                    property : consumption.length,
                    AvgConsumption : numPrice/consumption.length
                })
            }
            return result;
        }

        if(type==2){
            let result = [];
            let getMonthEchats = await getMonthEchats.getMonth(startTime,endTime);
            for (let i = 0; i < getMonthEchats.length; i++){
                let vipPhone = [];
                let numPrice =0;
                let consumption = await StatisticsOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt : new Date(getMonthEchats[i].start),
                            $lt : new Date(getMonthEchats[i].end)
                        }
                    },
                })
                for (let j = 0;j < consumption.length; j++){
                    let vips = await Vips.findOne({
                        where:{
                            phone:consumption[j].phone
                        }
                    })
                    if(vips!=null){
                        vipPhone.push(vips.phone)
                    }
                }
                for (let k = 0; k < vipPhone.length; k++){
                    let statisticsOrders = await StatisticsOrders.findOne({
                        where:{
                            tenantId : tenantId,
                            createdAt : {
                                $gt : new Date(getMonthEchats[i].start),
                                $lt : new Date(getMonthEchats[i].end)
                            },
                            phone : vipPhone[k]
                        }
                    })
                    numPrice+=statisticsOrders[k].totalPrice
                }
                result.push({
                    numPrice : numPrice,
                    property : consumption.length,
                    AvgConsumption : numPrice/consumption.length
                })
            }
            return result;
        }

        if(type==3){
            let result = [];
            let getQuarterEchats = await getQuarterEchats.getQuarter(startTime,endTime);
            for (let i = 0; i < getQuarterEchats.length; i++){
                let vipPhone = [];
                let numPrice =0;
                let consumption = await StatisticsOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt : new Date(getQuarterEchats[i].start),
                            $lt : new Date(getQuarterEchats[i].end)
                        }
                    },
                })
                for (let j = 0;j < consumption.length; j++){
                    let vips = await Vips.findOne({
                        where:{
                            phone:consumption[j].phone
                        }
                    })
                    if(vips!=null){
                        vipPhone.push(vips.phone)
                    }
                }
                for (let k = 0; k < vipPhone.length; k++){
                    let statisticsOrders = await StatisticsOrders.findOne({
                        where:{
                            tenantId : tenantId,
                            createdAt : {
                                $gt : new Date(getQuarterEchats[i].start),
                                $lt : new Date(getQuarterEchats[i].end)
                            },
                            phone : vipPhone[k]
                        }
                    })
                    numPrice+=statisticsOrders[k].totalPrice
                }
                result.push({
                    numPrice : numPrice,
                    property : consumption.length,
                    AvgConsumption : numPrice/consumption.length
                })
            }
            return result;
        }

        if(type==4){
            let result = [];
            let getYearEchat = await getYearEchat.getQuarter(startTime,endTime);
            for (let i = 0; i < getYearEchat.length; i++){
                let vipPhone = [];
                let numPrice =0;
                let consumption = await StatisticsOrders.findAll({
                    where:{
                        tenantId : tenantId,
                        createdAt : {
                            $gt : new Date(getYearEchat[i].start),
                            $lt : new Date(getYearEchat[i].end)
                        }
                    },
                })
                for (let j = 0;j < consumption.length; j++){
                    let vips = await Vips.findOne({
                        where:{
                            phone:consumption[j].phone
                        }
                    })
                    if(vips!=null){
                        vipPhone.push(vips.phone)
                    }
                }
                for (let k = 0; k < vipPhone.length; k++){
                    let statisticsOrders = await StatisticsOrders.findOne({
                        where:{
                            tenantId : tenantId,
                            createdAt : {
                                $gt : new Date(getYearEchat[i].start),
                                $lt : new Date(getYearEchat[i].end)
                            },
                            phone : vipPhone[k]
                        }
                    })
                    numPrice+=statisticsOrders[k].totalPrice
                }
                result.push({
                    numPrice : numPrice,
                    property : consumption.length,
                    AvgConsumption : numPrice/consumption.length
                })
            }
            return result;
        }

    }
    // 订单小票查询
    let getOrder = async function (tenantId,startTime,endTime,type) {
        let getTime = [];
        if(type==1){
            getTime = await getDayEchat.getDay(startTime,endTime)
        }
        if(type==2){
            getTime = await getMonthEchats.getMonth(startTime,endTime)
        }
        if(type==3){
            getTime = await getQuarterEchats.getQuarter(startTime,endTime)
        }
        if(type==4){
            getTime = await getYearEchat.getYear(startTime,endTime)
        }
        let result=[];
        for (let i = 0; i < getTime.length; i++){
            let statisticsOrders = await StatisticsOrders.findAll({
                where:{
                    tenantId:tenantId,
                    createdAt:{
                        $gt:new Date(getTime[i].start),
                        $lt : new Date(getTime[i].end)
                    }
                }
            })
            for (let j = 0;j<statisticsOrders.length;i++){
                result.push({
                    totalPrice:{
                        name : "订单价格",
                        value : statisticsOrders[j].totalPrice
                    },
                    merchantAmount:{
                        name:"转给商户的钱",
                        value:statisticsOrders[j].merchantAmount
                    },
                    consigneeAmount:{
                        name:"转给代售的钱",
                        value:statisticsOrders[j].consigneeAmount
                    },
                    platformAmount:{
                        name:"转给平台的钱",
                        value:statisticsOrders[j].platformAmount
                    },
                    deliveryFee:{
                        name:"配送费",
                        value:statisticsOrders[j].deliveryFee
                    },
                    refund_amount:{
                        name:"退款",
                        value:statisticsOrders[j].refund_amount
                    },
                    platformCouponFee:{
                        name:"平台优惠",
                        value:statisticsOrders[j].platformCouponFee
                    },
                    merchantCouponFee:{
                        name:"商家优惠",
                        value:statisticsOrders[j].merchantCouponFee
                    },
                    phone:{
                        name:"手机号",
                        value:statisticsOrders[j].phone
                    }

                })
            }
        }
        return result;
    }
    // 分成情况
    let getReat = async function (tenantId,startTime,endTime,type) {
        
    }


    let instance = {
        setOrders : setOrders,
        getAvgConsumption : getAvgConsumption,
        getVipAvgConsumption : getVipAvgConsumption,
        getOrder:getOrder
    }
    return instance;
})();

module.exports = getstatistics;