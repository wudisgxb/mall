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
let getHounthEchats = require('../echats/HounthEchats')
let getWeeksEchat = require('../echats/getWeeks')
let AnYearEchats = require('../echats/anYearEchats')

const getstatistics = (function () {
    // 设置Order表
    let setOrders = async function (json) {
        await StatisticsOrders.create({
            tenantId:json.tenantId,
            consigneeId:json.consigneeId,
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
            tenantId:json.tenantId,
            consigneeId:json.consigneeId,
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
                    numPrice : {
                        name : "价格",
                        value : numPrice
                    },
                    property : {
                        name : "人数",
                        value : consumption.length,
                    },
                    AvgConsumption : {
                        name : "平均价格",
                        value : numPrice/consumption.length
                    },
                    time : {
                        name : "现在时间",
                        value : new Date(i)
                    }
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
                    numPrice : {
                        name : "价格",
                        value : numPrice
                    },
                    property : {
                        name : "人数",
                        value : consumption.length,
                    },
                    AvgConsumption : {
                        name : "平均价格",
                        value : numPrice/consumption.length
                    },
                    time:{
                        name : "时间",
                        value : getMonthEchats[i].start
                    }
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
                let year = parseInt(getQuarterEchats[i].start.substring(0,4))
                let quart = (parseInt(getQuarterEchats[i].start.substring(5))+2)/3

                result.push({
                    numPrice : {
                        name : "价格",
                        value : numPrice
                    },
                    property : {
                        name : "人数",
                        value : consumption.length,
                    },
                    AvgConsumption : {
                        name : "平均价格",
                        value : numPrice/consumption.length
                    },
                    time:{
                        name:"时间",
                        value : year+"年，第"+quart+"季度"
                    }
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
                let year = parseInt(getYearEchat[i].start.substring(0,4));
                result.push({
                    numPrice : {
                        name : "价格",
                        value : numPrice
                    },
                    property : {
                        name : "人数",
                        value : consumption.length,
                    },
                    AvgConsumption : {
                        name : "平均价格",
                        value : numPrice/consumption.length
                    },
                    time : {
                        name : "时间",
                        value : year+"年"
                    }
                })
            }
            return result;
        }
        //每周平均消费


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
                    numPrice : {
                        name : "价格",
                        value : numPrice
                    },
                    property : {
                        name : "人数",
                        value : consumption.length,
                    },
                    AvgConsumption : {
                        name : "平均价格",
                        value : numPrice/consumption.length
                    },
                    time : {
                        name : "时间",
                        value : getDayEchat[i].start
                    }
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
                    numPrice : {
                        name : "价格",
                        value : numPrice
                    },
                    property : {
                        name : "人数",
                        value : consumption.length,
                    },
                    AvgConsumption : {
                        name : "平均价格",
                        value : numPrice/consumption.length
                    },
                    time : {
                        name : "时间",
                        value : getMonthEchats[i].start
                    }

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
                let year = parseInt(getQuarterEchats[i].start.substring(0,4))
                let quart = (parseInt(getQuarterEchats[i].start.substring(5))+2)/3
                result.push({
                    numPrice : {
                        name : "价格",
                        value : numPrice
                    },
                    property : {
                        name : "人数",
                        value : consumption.length,
                    },
                    AvgConsumption : {
                        name : "平均价格",
                        value : numPrice/consumption.length
                    },
                    time :{
                        name : "时间",
                        value : year+"年，第"+quart+"季度"
                    }
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
                let year = parseInt(getYearEchat[i].start.substring(0,4));
                result.push({
                    numPrice : {
                        name : "价格",
                        value : numPrice
                    },
                    property : {
                        name : "人数",
                        value : consumption.length,
                    },
                    AvgConsumption : {
                        name : "平均价格",
                        value : numPrice/consumption.length
                    },
                    time : {
                        name : "时间",
                        value : year+"年"
                    }
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
            let statisticsOrder = await StatisticsOrders.findAll({
                where:{
                    tenantId:tenantId,
                    createdAt:{
                        $gt : new Date(getTime[i].start),
                        $lt : new Date(getTime[i].end)
                    }
                }
            })

            let time ;
            if(type==1){
                time = getTime[i].start
            }
            if(type==2){
                time = getTime[i].start
            }
            if(type==3){
                let year = parseInt(getTime[i].start.substring(0,4))
                let quarter = (parseInt(getTime[i].start.substring(5))+2)/3
                time = year+"年"+quarter+"季度"
            }
            if(type==4){
                let year = parseInt(getTime[i].start.substring(0,4))
                time = year;
            }
            for (let j = 0;j<statisticsOrder.length;j++){
                result.push({
                    totalPrice:{
                        name : "订单价格",
                        value : statisticsOrder[j].totalPrice
                    },
                    merchantAmount:{
                        name:"转给商户的钱",
                        value:statisticsOrder[j].merchantAmount
                    },
                    consigneeAmount:{
                        name:"转给代售的钱",
                        value:statisticsOrder[j].consigneeAmount
                    },
                    platformAmount:{
                        name:"转给平台的钱",
                        value:statisticsOrder[j].platformAmount
                    },
                    deliveryFee:{
                        name:"配送费",
                        value:statisticsOrder[j].deliveryFee
                    },
                    refund_amount:{
                        name:"退款",
                        value:statisticsOrder[j].refund_amount
                    },
                    platformCouponFee:{
                        name:"平台优惠",
                        value:statisticsOrder[j].platformCouponFee
                    },
                    merchantCouponFee:{
                        name:"商家优惠",
                        value:statisticsOrder[j].merchantCouponFee
                    },
                    phone:{
                        name:"手机号",
                        value:statisticsOrder[j].phone
                    },
                    time:{
                        name : "时间",
                        value : time
                    }
                })
            }
        }
        return result;
    }

    //统计小票
    let getOrderNum = async function (tenantId,startTime,endTime,type) {
        let getTime = [];
        if(type==1){
            getTime = await getHounthEchats.getHounth(startTime,endTime)
        }
        if(type==2){
            getTime = await getDayEchat.getDay(startTime,endTime)
        }
        if(type==3){
            getTime = await AnYearEchats.getAnYear(startTime,endTime)
        }
        // if(type==4){
        //     getTime = await getQuarterEchats.getQuarter(startTime,endTime)
        // }
        let result=[];
        for (let i = 0; i < getTime.length; i++){
            let statisticsOrder = await StatisticsOrders.findAll({
                where:{
                    tenantId:tenantId,
                    createdAt:{
                        $gt : new Date(getTime[i].start),
                        $lt : new Date(getTime[i].end)
                    }
                }
            })
            //总营收
            let totalPrice = await StatisticsOrders.sum("totalPrice",{
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt : new Date(getTime[i].start),
                            $lt : new Date(getTime[i].end)
                        }
                    }

            })
            let merchantCouponFee = await StatisticsOrders.sum("merchantCouponFee",{
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt : new Date(getTime[i].start),
                            $lt : new Date(getTime[i].end)
                        }
                    }
                })
            let platformCouponFee = await StatisticsOrders.sum("platformCouponFee", {
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt : new Date(getTime[i].start),
                            $lt : new Date(getTime[i].end)
                        }
                    }
                })
            let platformAmount = await StatisticsOrders.sum("platformAmount",{
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt : new Date(getTime[i].start),
                            $lt : new Date(getTime[i].end)
                        }
                    }
                })
            let merchantAmount = await StatisticsOrders.sum("merchantAmount",{
                    where:{
                        tenantId:tenantId,
                        createdAt:{
                            $gt : new Date(getTime[i].start),
                            $lt : new Date(getTime[i].end)
                        }
                    }
            })
            let refund_Amount = await StatisticsOrders.sum("refund_amount",{
                where:{
                    tenantId:tenantId,
                    createdAt:{
                        $gt : new Date(getTime[i].start),
                        $lt : new Date(getTime[i].end)
                    }
                }
            })
            let deliveryFee = await StatisticsOrders.sum("deliveryFee",{
                where:{
                    tenantId:tenantId,
                    createdAt:{
                        $gt : new Date(getTime[i].start),
                        $lt : new Date(getTime[i].end)
                    }
                }
            })
            let consigneeAmount = await StatisticsOrders.sum("consigneeAmount",{
                where:{
                    tenantId:tenantId,
                    createdAt:{
                        $gt : new Date(getTime[i].start),
                        $lt : new Date(getTime[i].end)
                    }
                }
            })
            let time ;
            if(type==1){
                let start = (i*3+1)
                let end = (i+1)*3
                time =start+"-"+end
            }
            if(type==2){
                let start =i+1
                time = "第"+start+"周"
            }
            if(type==3){
                let start = i+1
                time = "第"+start+"个月"
            }
            result.push({
                merchantPayment:{
                    name :"商家实际支付",
                    value : totalPrice-platformCouponFee-merchantCouponFee-refund_Amount+deliveryFee
                },
                consigneeAmount :{
                    name : "转给代售的钱",
                    value : consigneeAmount==null?0:consigneeAmount
                },
                merchantAmount :{
                    name : "商家实收",
                    value : merchantAmount==null?0:merchantAmount
                },
                platformAmount:{
                    name : "平台服务费",
                    value : platformAmount==null?0:platformAmount
                },
                platformCouponFee:{
                    name : "平台优惠",
                    value : platformCouponFee==null?0:platformCouponFee
                },
                merchantCouponFee:{
                    name : "商家优惠",
                    value : merchantCouponFee==null?0:merchantCouponFee
                },
                totalPrice:{
                    name : "总营收",
                    value : totalPrice==null?0:totalPrice
                },
                num:{
                    name : "统计当前时间的订单数量",
                    value : statisticsOrder.length
                },
                time:{
                    name:"时间",
                    value :time
                }
            })


        }
        return result;
    }
    // 分成情况
    let getReat = async function (tenantId,startTime,endTime,type) {
        let result=[];
        let getTime=[];
        let time;
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
        for (let i = 0;i < getTime.length; i++){
            let statisticsOrders = await StatisticsOrders.findAll({
                where:{
                    tenantId:tenantId,
                    createdAt:{
                        $gt : new Date(getTime[i].start),
                        $lt : new Date(getTime[i].end)
                    }
                }
            })

            if(type==1){
                time = getTime[i].start
            }
            if(type==2){
                time = getTime[i].start
            }
            if(type==3){
                let year = parseInt(getTime[i].start.substring(0,4))
                let quarter = (parseInt(getTime[i].start.substring(5))+2)/3
                time = year+"年"+quarter+"季度"
            }
            if(type==4){
                let year = parseInt(getTime[i].start.substring(0,4))
                time = year;
            }
            for(let j = 0;j < statisticsOrders.length; j++){
                result.push({
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
                    time:{
                        name:"时间",
                        value:time
                    }
                })
            }

        }
        return result;
    }


    let instance = {
        setOrders : setOrders,
        getAvgConsumption : getAvgConsumption,
        getVipAvgConsumption : getVipAvgConsumption,
        getOrder : getOrder,
        getReat : getReat,
        getOrderNum:getOrderNum
    }
    return instance;
})();

module.exports = getstatistics;