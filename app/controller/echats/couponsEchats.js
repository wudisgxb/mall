const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Coupons = db.models.Coupons;
let getMonthEchats = require('../echats/MonthEchats')
let getQuarterEchats = require('../echats/quarterEchats')
let getYearEchat = require('../echats/yearEchat')
let OnedayEchat = require('../echats/oneDayEchat')

const getCouponsEchats = (function () {
    //使用优惠券数量
    let getCoupons = async function (tenantId, startTime, endTime, type) {
        //type==1日报表。type==2季度报表，type==3月报表，type==4年报表
        if (type == 1) {
            let result = [];
            //startTime开始时间
            //endTime结束时间
            let OneDay = await OnedayEchat.getDay(startTime, endTime)
            for (let i = 0; i < OneDay.length; i++) {
                //当天tenantId的所有使用优惠券记录
                let useCoupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 1
                    }
                })
                //查询所有优惠券领取数量
                let drawCoupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        }
                    },
                    paranoid: false
                })
                //查询优惠券过期的数量
                let couponsPastdue = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 0,
                        deletedAt: {
                            $ne: null
                        }
                    },
                    paranoid: false
                })
                result.push({
                    couponsPastdue: {
                        name: "过期优惠券数量",
                        value: couponsPastdue.length
                    },
                    useCoupons: {
                        name: "使用优惠券数量",
                        value: useCoupons.length,
                        useCoupons:useCoupons,
                    },
                    drawCoupons: {
                        name: "领取优惠券数量",
                        value: drawCoupons.length
                    },
                    time: OneDay[i].start
                })
            }
            return result;
        }
        if (type == 3) {
            let result = [];
            let MonthEchats = await getMonthEchats.getMonth(startTime, endTime)
            for (let i = 0; i < MonthEchats.length; i++) {
                //当天tenantId的所有使用优惠券记录
                let useCoupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 1
                    }
                })
                //查询所有优惠券领取数量
                let drawCoupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        }
                    },
                    paranoid: false
                })
                //查询优惠券过期的数量
                let couponsPastdue = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 0,
                        deletedAt: {
                            $ne: null
                        }
                    },
                    paranoid: false
                })
                // let time = new Date(i);
                // time.setDate(time.getDate()+1)
                // let times = time.format("yyyy-MM-dd 0:0:0");
                result.push({
                    couponsPastdue: {
                        name: "过期优惠券数量",
                        value: couponsPastdue.length
                    },
                    useCoupons: {
                        name: "使用优惠券数量",
                        value: useCoupons.length
                    },
                    drawCoupons: {
                        name: "领取优惠券数量",
                        value: drawCoupons.length
                    },
                    time: MonthEchats[i].start
                })
            }
            return result;

        }
        if (type == 2) {
            let result = [];
            let Quaeter = getQuarterEchats.getQuarter(startTime, endTime);
            for (let i = 0; i < Quaeter.length; i++) {
                //当天tenantId的所有使用优惠券记录
                let useCoupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 1
                    }
                })
                //查询所有优惠券领取数量
                let drawCoupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        }
                    },
                    paranoid: false
                })
                //查询优惠券过期的数量
                let couponsPastdue = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 0,
                        deletedAt: {
                            $ne: null
                        }
                    },
                    paranoid: false
                })

                let startDate = Quaeter[i].start
                let year = parseInt(startDate.substring(0, 4))
                let time = parseInt(startDate.substring(5, 6));
                // console.log(time)
                let quaeters = (time + 2) / 3

                result.push({
                    couponsPastdue: {
                        name: "过期优惠券数量",
                        value: couponsPastdue.length
                    },
                    useCoupons: {
                        name: "使用优惠券数量",
                        value: useCoupons.length
                    },
                    drawCoupons: {
                        name: "领取优惠券数量",
                        value: drawCoupons.length
                    },
                    time: year + "年第" + quaeters + "季度"
                })
            }
            return result;
        }
        if (type == 4) {
            let result = [];
            let years = getYearEchat.getYear(startTime, endTime);
            for (let i = 0; i < years.length; i++) {
                //当天tenantId的所有使用优惠券记录
                let useCoupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 1
                    }
                })
                //查询所有优惠券领取数量
                let drawCoupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        }
                    },
                    paranoid: false
                })
                //查询优惠券过期的数量
                let couponsPastdue = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 0,
                        deletedAt: {
                            $ne: null
                        }
                    },
                    paranoid: false
                })

                let startDate = years[i].start
                let year = parseInt(startDate.substring(0, 4))

                result.push({
                    couponsPastdue: {
                        name: "过期优惠券数量",
                        value: couponsPastdue.length
                    },
                    useCoupons: {
                        name: "使用优惠券数量",
                        value: useCoupons.length
                    },
                    drawCoupons: {
                        name: "领取优惠券数量",
                        value: drawCoupons.length
                    },
                    time: year + "年"
                })
            }
            return result;
        }


    }
    //查询领取优惠券的总数量
    let getAllCoupons = async function (tenantId, startTime, endTime, type) {
        if (type == 1) {
            let result = [];
            //startTime开始时间
            //endTime结束时间
            let OneDay = await OnedayEchat.getDay(startTime, endTime)
            for (let i = 0; i < OneDay.length; i++) {
                //当天tenantId的所有记录
                let coupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        }
                    },
                    paranoid: false
                })
                result.push({
                    coupons: coupons,
                    time: OneDay[i].start
                })
            }
            return result;
        }
        if (type == 3) {
            let result = [];
            let MonthEchats = await getMonthEchats.getMonth(startTime, endTime)
            for (let i = 0; i < MonthEchats.length; i++) {
                let coupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        }
                    },
                    paranoid: false
                })
                // let time = new Date(i);
                // time.setDate(time.getDate()+1)
                // let times = time.format("yyyy-MM-dd 0:0:0");
                result.push({
                    couponsCount: coupons.length,
                    time: MonthEchats[i].start
                })
            }
            return result;

        }
        if (type == 2) {
            let result = [];
            let Quaeter = getQuarterEchats.getQuarter(startTime, endTime);
            for (let i = 0; i < Quaeter.length; i++) {
                let coupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        }
                    },
                    paranoid: false
                })
                let startDate = Quaeter[i].start
                let year = parseInt(startDate.substring(0, 4))
                let time = parseInt(startDate.substring(5, 6));
                // console.log(time)
                let quaeters = (time + 2) / 3

                result.push({
                    couponsCount: coupons.length,
                    time: year + "年第" + quaeters + "季度"
                })
            }
            return result;
        }
        if (type == 4) {
            let result = [];
            let years = getYearEchat.getYear(startTime, endTime);
            for (let i = 0; i < years.length; i++) {
                let coupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        }
                    },
                    paranoid: false
                })
                let startDate = years[i].start
                let year = parseInt(startDate.substring(0, 4))

                result.push({
                    couponsCount: coupons.length,
                    time: year + "年"
                })
            }
            return result;
        }
    }
    //过期优惠券数量
    let getPastdueCoupons = async function (tenantId, startTime, endTime, type) {
        if (type == 1) {
            let result = [];
            //startTime开始时间
            //endTime结束时间
            let OneDay = await OnedayEchat.getDay(startTime, endTime)
            for (let i = 0; i < OneDay.length; i++) {
                //当天tenantId的所有记录
                let couponsPastdue = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 0,
                        deletedAt: {
                            $ne: null
                        }
                    },
                    paranoid: false
                })
                result.push({

                    couponsPastdue: couponsPastdue.length,
                    time: OneDay[i].start
                })
            }
            return result;
        }
        if (type == 3) {
            let result = [];
            let MonthEchats = await getMonthEchats.getMonth(startTime, endTime)
            for (let i = 0; i < MonthEchats.length; i++) {
                let coupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 0,
                        deletedAt: {
                            $ne: null
                        }
                    },
                    paranoid: false
                })
                // let time = new Date(i);
                // time.setDate(time.getDate()+1)
                // let times = time.format("yyyy-MM-dd 0:0:0");
                result.push({
                    couponsCount: coupons.length,
                    time: MonthEchats[i].start
                })
            }
            return result;

        }
        if (type == 2) {
            let result = [];
            let Quaeter = getQuarterEchats.getQuarter(startTime, endTime);
            for (let i = 0; i < Quaeter.length; i++) {
                let coupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 0,
                        deletedAt: {
                            $ne: null
                        }
                    },
                    paranoid: false
                })
                let startDate = Quaeter[i].start
                let year = parseInt(startDate.substring(0, 4))
                let time = parseInt(startDate.substring(5, 6));
                // console.log(time)
                let quaeters = (time + 2) / 3

                result.push({
                    couponsCount: coupons.length,
                    time: year + "年第" + quaeters + "季度"
                })
            }
            return result;
        }
        if (type == 4) {
            let result = [];
            let years = getYearEchat.getYear(startTime, endTime);
            for (let i = 0; i < years.length; i++) {
                let coupons = await Coupons.findAll({
                    where: {
                        tenantId: tenantId,
                        createdAt: {
                            $gte: new Date(OneDay[i].start),
                            $lt: new Date(OneDay[i].end)
                        },
                        status: 0,
                        deletedAt: {
                            $ne: null
                        }
                    },
                    paranoid: false
                })
                let startDate = years[i].start
                let year = parseInt(startDate.substring(0, 4))

                result.push({
                    couponsCount: coupons.length,
                    time: year + "年"
                })
            }
            return result;
        }
    }

    let instance = {
        getCoupons: getCoupons,
        getPastdueCoupons: getPastdueCoupons,
        getAllCoupons: getAllCoupons
    }
    return instance;
})();
module.exports = getCouponsEchats;
