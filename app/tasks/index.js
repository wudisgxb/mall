const myAlipay = require('../controller/alipay/index');
const request = require('request');
const schedule = require("node-schedule");
const Tool = require('../Tool/tool');

var transAccountsManager = require('../controller/alipay/transferAccounts');
var fs = require('fs');
const path = require('path');
const db = require('../db/mysql/index');
const Orders = db.models.NewOrders;
const Foods = db.models.Foods
const Tables = db.models.Tables;
const ShoppingCarts = db.models.ShoppingCarts;
const PaymentReqs = db.models.PaymentReqs;
const TransferAccounts = db.models.TransferAccounts;
const Consignees = db.models.Consignees;
const TenantConfigs = db.models.TenantConfigs;
const ProfitSharings = db.models.ProfitSharings;

const co = require('co')
const WXPay = require('co-wechat-payment')
const ip = require('ip').address();
const config = require('../config/config')
const amountManager = require('../controller/amount/amountManager')

const wxpay = new WXPay({
    appId: config.wechat.appId,
    mchId: config.wechat.mchId,
    partnerKey: config.wechat.partnerKey, //微信商户平台API密钥
    pfx: fs.readFileSync('./app/config/apiclient_cert.p12'), //微信商户平台证书
})


module.exports = async function tasks(app) {
    let timeTransferAccounts = async function () {
        let rule = new schedule.RecurrenceRule();

        rule.dayOfWeek = [0, new schedule.Range(1, 6)];

        rule.hour = 18;

        rule.minute = 1;
        rule.second = 1;
        schedule.scheduleJob(rule, async function () {
            await aliTransferAccounts();
            await wechatTransferAccounts();
            await updateFoodSellCount();
        });
    }

    let mounthTransferAccounts = async function (tenantId) {
        let fn
        let transferAccounts = await TransferAccounts.findAll({
            where:{
                tenantId : tenantId,
                // paymentMethod : paymentMethod,
                status : 0
            }
        })
        let merchantAmount = await TransferAccounts.sum("amount",{
            where:{
                tenantId : tenantId,
                // paymentMethod : paymentMethod,
                status : 0
            }
        })
        let tenantConfig = await TenantConfigs.findOne({
            where:{
                tenantId : tenantId
            }
        })
        let profitSharings = await ProfitSharings.findOne({
            where:{
                tenantId : tenantId
            }
        })
        let consignees = await Consignees.findOne({
            where:{
                consigneeId : profitSharings.consigneeId
            }
        })

        if (tenantConfig != null) {
            console.log("服务器公网IP：" + ip);
            fn = co.wrap(wxpay.transfers.bind(wxpay))

            var params = {
                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                openid: tenantConfig.wecharPayee_account,
                check_name: 'NO_CHECK',
                amount: (merchantAmount * 100).toFixed(0),
                desc: '日收益',
                spbill_create_ip: ip
            }

            try {
                var result = await fn(params);
                // console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result, null, 2));
                if (result.result_code == 'SUCCESS') {
                    let paymentReqs = await PaymentReqs.findAll({
                        where: {
                            tenantId: tenantId,
                            consigneeId: consignees.consigneeId,
                            paymentMethod: '微信',
                            isFinish: true,
                            isInvalid: false,
                            TransferAccountIsFinish: false,
                            consigneeTransferAccountIsFinish: false
                        }
                    });

                    for (var j = 0; j < paymentReqs.length; j++) {
                        paymentReqs[j].TransferAccountIsFinish = true;
                        await paymentReqs[j].save();
                    }

                    //待转账表状态修改从0-1
                    transferAccounts = await TransferAccounts.findAll({
                        where: {
                            tenantId: tenantId,
                            consigneeId: consigneeId,
                            paymentMethod: '微信',
                            role: '租户',
                            status: 0
                        }
                    })

                    for (var k = 0; k < transferAccounts.length; k++) {
                        transferAccounts[k].status = 1;
                        transferAccounts[k].pay_date = payDate;
                        await transferAccounts[k].save();
                    }
                    console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                    console.log("当前微信转账记录0||tenantId:" + tenantId + " consignee:" + consignee + " merchantAmount:" + merchantAmount);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    let updateFoodSellCount = async function () {
        let foods = await Foods.findAll({})
        console.log(foods.length)
        let foodSellcount = [];
        for (let i = 0; i < foods.length; i++) {
            foodSellcount.push(Foods.update({
                todaySales : "0",
            }, {
                where: {
                    id: foods[i].id
                }
            }))
        }
        await foodSellcount
    }

    let wechatTransferAccounts = async function () {
        //把需要转账的租户，代售商户查询出来
        let tmpArray = [];//存放租户，代售商户对象的数组
        let tmpJson = {};
        let merchantAmount = 0;//给租户的转账金额
        let consigneeAmount = 0;//给代售的转账金额
        let fn;
        let paymentReqs;
        let payDate = new Date().format("yyyyMMddhhmmss");

        let transferAccounts = await TransferAccounts.findAll({
            where: {
                status: 0,
                paymentMethod: '微信',
            }
        });

        //遍历数据库 存储不同的主商户-代售商户
        for (var i = 0; i < transferAccounts.length; i++) {
            tmpJson.consigneeId = transferAccounts[i].consigneeId;
            tmpJson.tenantId = transferAccounts[i].tenantId;
            if (tmpArray.length == 0) {
                tmpArray.push(tmpJson);
            } else {
                if (Tool.jsonIsInArray(tmpArray, tmpJson) == false) {
                    tmpArray.push(tmpJson);
                }
            }
            tmpJson = {};
        }
        console.log("代售商户tmpArray.length:" + tmpArray.length);

        let tenantId;
        let consigneeId;
        let tenantConfig;
        let consignee;
        if (tmpArray.length > 0) {
            for (var kkk = 0; kkk < tmpArray.length; kkk++) {
                tenantId = tmpArray[kkk].tenantId;
                consigneeId = tmpArray[kkk].consigneeId;
                console.log("tenantId:" + tenantId);
                console.log("consigneeId:" + consigneeId);
                merchantAmount = await TransferAccounts.sum(
                    'amount',
                    {
                        where: {
                            tenantId: tenantId,
                            consigneeId: consigneeId,
                            paymentMethod: '微信',
                            role: '租户',
                            status: 0
                        }
                    });

                consigneeAmount = await TransferAccounts.sum(
                    'amount',
                    {
                        where: {
                            tenantId: tenantId,
                            consigneeId: consigneeId,
                            paymentMethod: '微信',
                            role: '代售',
                            status: 0
                        }
                    });

                //查找主商户信息
                tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: tenantId
                    }
                });

                //查找代售商户信息
                consignee = await Consignees.findOne({
                    where: {
                        consigneeId: consigneeId
                    }
                });
                
                console.log("租户微信转账金额：" + merchantAmount);
                console.log("代售微信转账金额：" + consigneeAmount);
                //判断是否有利润分成
                if(!tenantConfig.isProfitRate){
                    console.log(1111111111111111)
                    if (tenantConfig != null) {
                        console.log("tenantId1:" + tenantId);
                        console.log("consigneeId1:" + consigneeId)
                        console.log("租户微信转账金额1：" + merchantAmount);
                        console.log("代售微信转账金额1：" + consigneeAmount);
                        console.log("服务器公网IP：" + ip);
                        fn = co.wrap(wxpay.transfers.bind(wxpay))
                        if (consignee == null) {
                            var params = {
                                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                openid: tenantConfig.wecharPayee_account,
                                check_name: 'NO_CHECK',
                                amount: (merchantAmount * 100).toFixed(0),
                                desc: '日收益',
                                spbill_create_ip: ip
                            }

                            try {
                                var result = await fn(params);
                                console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result, null, 2));

                                if (result.result_code == 'SUCCESS') {
                                    paymentReqs = await PaymentReqs.findAll({
                                        where: {
                                            tenantId: tenantId,
                                            consigneeId: consigneeId,
                                            paymentMethod: '微信',
                                            isFinish: true,
                                            isInvalid: false,
                                            TransferAccountIsFinish: false,
                                            consigneeTransferAccountIsFinish: false
                                        }
                                    });

                                    for (var j = 0; j < paymentReqs.length; j++) {
                                        paymentReqs[j].TransferAccountIsFinish = true;
                                        await paymentReqs[j].save();
                                    }

                                    //待转账表状态修改从0-1
                                    transferAccounts = await TransferAccounts.findAll({
                                        where: {
                                            tenantId: tenantId,
                                            consigneeId: consigneeId,
                                            paymentMethod: '微信',
                                            role: '租户',
                                            status: 0
                                        }
                                    })

                                    for (var k = 0; k < transferAccounts.length; k++) {
                                        transferAccounts[k].status = 1;
                                        transferAccounts[k].pay_date = payDate;
                                        await transferAccounts[k].save();
                                    }

                                    console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                    console.log("每日微信转账记录0||tenantId:" + tenantId + " consignee:" + consignee + " merchantAmount:" + merchantAmount);
                                }
                            } catch (e) {
                                console.log(e);
                            }

                        } else {
                            let profitsharing = await ProfitSharings.findOne({
                                where: {
                                    tenantId: tenantId,
                                    consigneeId: consigneeId
                                }
                            });
                            if (profitsharing == null) {
                                var params = {
                                    partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                    openid: tenantConfig.wecharPayee_account,
                                    check_name: 'NO_CHECK',
                                    amount: (merchantAmount * 100).toFixed(0),
                                    desc: '日收益',
                                    spbill_create_ip: ip
                                }

                                try {
                                    var result = await fn(params);
                                    console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT1result:" + JSON.stringify(result, null, 2));
                                    if (result.result_code == 'SUCCESS') {
                                        paymentReqs = await PaymentReqs.findAll({
                                            where: {
                                                tenantId: tenantId,
                                                consigneeId: consigneeId,
                                                paymentMethod: '微信',
                                                isFinish: true,
                                                isInvalid: false,
                                                TransferAccountIsFinish: false,
                                                consigneeTransferAccountIsFinish: false
                                            }
                                        });

                                        for (var j = 0; j < paymentReqs.length; j++) {
                                            paymentReqs[j].TransferAccountIsFinish = true;
                                            await paymentReqs[j].save();
                                        }

                                        transferAccounts = await TransferAccounts.findAll({
                                            where: {
                                                tenantId: tenantId,
                                                consigneeId: consigneeId,
                                                paymentMethod: '微信',
                                                role: '租户',
                                                status: 0
                                            }
                                        })

                                        for (var k = 0; k < transferAccounts.length; k++) {
                                            transferAccounts[k].status = 1;
                                            transferAccounts[k].pay_date = payDate;
                                            await transferAccounts[k].save();
                                        }

                                        console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                        console.log("每日微信转账记录1||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + merchantAmount);

                                    }
                                } catch (e) {
                                    console.log(e);
                                }
                            } else {
                                console.log("主商户分润：" + merchantAmount);
                                var params = {
                                    partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                    openid: tenantConfig.wecharPayee_account,
                                    check_name: 'NO_CHECK',
                                    amount: (merchantAmount * 100).toFixed(0),
                                    desc: profitsharing.merchantRemark,
                                    spbill_create_ip: ip
                                }

                                try {
                                    var result1 = await fn(params);
                                    console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT2result:" + JSON.stringify(result1, null, 2));
                                    console.log("result.result_code:" + result1.result_code);
                                    if (result1.result_code == 'SUCCESS') {
                                        paymentReqs = await PaymentReqs.findAll({
                                            where: {
                                                tenantId: tenantId,
                                                consigneeId: consigneeId,
                                                paymentMethod: '微信',
                                                isFinish: true,
                                                isInvalid: false,
                                                TransferAccountIsFinish: false,
                                                consigneeTransferAccountIsFinish: false
                                            }
                                        });

                                        for (var jj = 0; jj < paymentReqs.length; jj++) {
                                            paymentReqs[jj].TransferAccountIsFinish = true;
                                            await paymentReqs[jj].save();
                                        }

                                        transferAccounts = await TransferAccounts.findAll({
                                            where: {
                                                tenantId: tenantId,
                                                consigneeId: consigneeId,
                                                paymentMethod: '微信',
                                                role: '租户',
                                                status: 0
                                            }
                                        })

                                        for (var kk = 0; kk < transferAccounts.length; kk++) {
                                            transferAccounts[kk].status = 1;
                                            transferAccounts[kk].pay_date = payDate;
                                            await transferAccounts[kk].save();
                                        }

                                        if (consigneeAmount != null && consigneeAmount > 0) {
                                            console.log("代售点分润：" + consigneeAmount);
                                            params = {
                                                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                                openid: consignee.wecharPayee_account,
                                                check_name: 'NO_CHECK',
                                                amount: (consigneeAmount * 100).toFixed(0),
                                                desc: profitsharing.consigneeRemark,
                                                spbill_create_ip: ip
                                            }

                                            var result2 = await fn(params);
                                            console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3result:" + JSON.stringify(result2, null, 2));
                                            console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                            console.log("每日微信转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + merchantAmount);
                                            if (result2.result_code == 'SUCCESS') {
                                                for (var jj = 0; jj < paymentReqs.length; jj++) {
                                                    paymentReqs[jj].consigneeTransferAccountIsFinish = true;
                                                    await paymentReqs[jj].save();
                                                }

                                                transferAccounts = await TransferAccounts.findAll({
                                                    where: {
                                                        tenantId: tenantId,
                                                        consigneeId: consigneeId,
                                                        paymentMethod: '微信',
                                                        role: '代售',
                                                        status: 0
                                                    }
                                                })

                                                for (var kk = 0; kk < transferAccounts.length; kk++) {
                                                    transferAccounts[kk].status = 1;
                                                    transferAccounts[kk].pay_date = payDate;
                                                    await transferAccounts[kk].save();
                                                }
                                                console.log("每日微信转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " consigneeAmount:" + consigneeAmount);
                                            }
                                        }

                                    }
                                } catch (e) {
                                    console.log(e);
                                }

                            }
                        }
                    }
                }else{
                    console.log("利润分成不转账")
                }

                merchantAmount = 0;
                consigneeAmount = 0;
            }
        }
    }

    let aliTransferAccounts = async function () {

        //把需要转账的租户，代售商户查询出来
        let tmpArray = [];//存放租户，代售商户对象的数组
        let tmpJson = {};
        let merchantAmount = 0;//给租户的转账金额
        let consigneeAmount = 0;//给代售的转账金额
        let paymentReqs;
        let payDate = new Date().format("yyyyMMddhhmmss");

        let transferAccounts = await TransferAccounts.findAll({
            where: {
                status: 0,
                paymentMethod: '支付宝',
            }
        });

        //遍历数据库 存储不同的主商户-代售商户
        for (var i = 0; i < transferAccounts.length; i++) {
            tmpJson.consigneeId = transferAccounts[i].consigneeId;
            tmpJson.tenantId = transferAccounts[i].tenantId;
            if (tmpArray.length == 0) {
                tmpArray.push(tmpJson);
            } else {
                if (Tool.jsonIsInArray(tmpArray, tmpJson) == false) {
                    tmpArray.push(tmpJson);
                }
            }
            tmpJson = {};
        }
        console.log("tmpArray.length:" + tmpArray.length);

        let tenantId;
        let consigneeId;
        let tenantConfig;
        let consignee;
        if (tmpArray.length > 0) {
            for (var kkk = 0; kkk < tmpArray.length; kkk++) {
                tenantId = tmpArray[kkk].tenantId;
                consigneeId = tmpArray[kkk].consigneeId;
                console.log("tenantId:" + tenantId);
                console.log("consigneeId:" + consigneeId);
                merchantAmount = await TransferAccounts.sum(
                    'amount',
                    {
                        where: {
                            tenantId: tenantId,
                            consigneeId: consigneeId,
                            paymentMethod: '支付宝',
                            role: '租户',
                            status: 0
                        }
                    });

                consigneeAmount = await TransferAccounts.sum(
                    'amount',
                    {
                        where: {
                            tenantId: tenantId,
                            consigneeId: consigneeId,
                            paymentMethod: '支付宝',
                            role: '代售',
                            status: 0
                        }
                    });

                //查找主商户信息
                tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: tenantId
                    }
                });

                //查找代售商户信息
                consignee = await Consignees.findOne({
                    where: {
                        consigneeId: consigneeId
                    }
                });

                console.log("租户转账金额：" + merchantAmount);
                console.log("代售转账金额：" + consigneeAmount);
                if(!tenantConfig.isProfitRate){
                    if (tenantConfig != null) {
                        if (consignee == null) {
                            var result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, merchantAmount, null, '日收益', tenantId);
                            console.log("无代售0:" + JSON.stringify(result, null, 2));
                            if (result.msg == 'Success') {
                                paymentReqs = await PaymentReqs.findAll({
                                    where: {
                                        tenantId: tenantId,
                                        consigneeId: consigneeId,
                                        paymentMethod: '支付宝',
                                        isFinish: true,
                                        isInvalid: false,
                                        TransferAccountIsFinish: false,
                                        consigneeTransferAccountIsFinish: false
                                    }
                                });

                                for (var j = 0; j < paymentReqs.length; j++) {
                                    paymentReqs[j].TransferAccountIsFinish = true;
                                    await paymentReqs[j].save();
                                }

                                //待转账表状态修改从0-1
                                transferAccounts = await TransferAccounts.findAll({
                                    where: {
                                        tenantId: tenantId,
                                        consigneeId: consigneeId,
                                        paymentMethod: '支付宝',
                                        role: '租户',
                                        status: 0
                                    }
                                })

                                for (var k = 0; k < transferAccounts.length; k++) {
                                    transferAccounts[k].status = 1;
                                    transferAccounts[k].pay_date = payDate;
                                    await transferAccounts[k].save();
                                }

                                console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                console.log("每日支付宝转账记录0||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + merchantAmount);
                            }

                        } else {
                            var profitsharing = await ProfitSharings.findOne({
                                where: {
                                    tenantId: tenantId,
                                    consigneeId: consigneeId
                                }
                            });
                            if (profitsharing == null) {
                                var result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, merchantAmount, null, '日收益', tenantId);
                                console.log("无代售1:" + JSON.stringify(result, null, 2));
                                if (result.msg == 'Success') {
                                    paymentReqs = await PaymentReqs.findAll({
                                        where: {
                                            tenantId: tenantId,
                                            consigneeId: consigneeId,
                                            paymentMethod: '支付宝',
                                            isFinish: true,
                                            isInvalid: false,
                                            TransferAccountIsFinish: false,
                                            consigneeTransferAccountIsFinish: false
                                        }
                                    });

                                    for (var j = 0; j < paymentReqs.length; j++) {
                                        paymentReqs[j].TransferAccountIsFinish = true;
                                        await paymentReqs[j].save();
                                    }

                                    //待转账表状态修改从0-1
                                    transferAccounts = await TransferAccounts.findAll({
                                        where: {
                                            tenantId: tenantId,
                                            consigneeId: consigneeId,
                                            paymentMethod: '支付宝',
                                            role: '租户',
                                            status: 0
                                        }
                                    })

                                    for (var k = 0; k < transferAccounts.length; k++) {
                                        transferAccounts[k].status = 1;
                                        transferAccounts[k].pay_date = payDate;
                                        await transferAccounts[k].save();
                                    }

                                    console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                    console.log("每日支付宝转账记录1||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + merchantAmount);
                                }
                            } else {
                                var ret1 = await transAccountsManager.transferAccounts(tenantConfig.payee_account, merchantAmount, null, profitsharing.merchantRemark, tenantId);
                                if (ret1.msg == 'Success') {
                                    paymentReqs = await PaymentReqs.findAll({
                                        where: {
                                            tenantId: tenantId,
                                            consigneeId: consigneeId,
                                            paymentMethod: '支付宝',
                                            isFinish: true,
                                            isInvalid: false,
                                            TransferAccountIsFinish: false,
                                            consigneeTransferAccountIsFinish: false
                                        }
                                    });

                                    for (var jj = 0; jj < paymentReqs.length; jj++) {
                                        paymentReqs[jj].TransferAccountIsFinish = true;
                                        await paymentReqs[jj].save();
                                    }

                                    transferAccounts = await TransferAccounts.findAll({
                                        where: {
                                            tenantId: tenantId,
                                            consigneeId: consigneeId,
                                            paymentMethod: '支付宝',
                                            role: '租户',
                                            status: 0
                                        }
                                    })

                                    for (var kk = 0; kk < transferAccounts.length; kk++) {
                                        transferAccounts[kk].status = 1;
                                        transferAccounts[kk].pay_date = payDate;
                                        await transferAccounts[kk].save();
                                    }

                                    console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                    console.log("每日支付宝转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + merchantAmount);
                                    console.log("consigneeAmount:" + consigneeAmount);

                                    if (consigneeAmount != null && consigneeAmount > 0) {
                                        var ret2 = await transAccountsManager.transferAccounts(consignee.payee_account, consigneeAmount, null, profitsharing.consigneeRemark, tenantId);
                                        if (ret2.msg == 'Success') {
                                            for (var jj = 0; jj < paymentReqs.length; jj++) {
                                                paymentReqs[jj].consigneeTransferAccountIsFinish = true;
                                                await paymentReqs[jj].save();
                                            }

                                            transferAccounts = await TransferAccounts.findAll({
                                                where: {
                                                    tenantId: tenantId,
                                                    consigneeId: consigneeId,
                                                    paymentMethod: '支付宝',
                                                    role: '代售',
                                                    status: 0
                                                }
                                            })

                                            for (var kk = 0; kk < transferAccounts.length; kk++) {
                                                transferAccounts[kk].status = 1;
                                                transferAccounts[kk].pay_date = payDate;
                                                await transferAccounts[kk].save();
                                            }

                                            console.log("每日支付宝转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " consigneeAmount:" + consigneeAmount);
                                        } else {
                                            console.log("代售商户支付宝转账失败：" + JSON.stringify(ret2, null, 2));
                                        }
                                    }
                                } else {
                                    console.log("主商户支付宝转账失败：" + JSON.stringify(ret1, null, 2))
                                }
                            }
                        }
                    }
                }else{
                    console.log("利润分成不转账")
                }

                merchantAmount = 0;
                consigneeAmount = 0;
            }
        }
    }



    // let wechatTransferAccounts = async function () {
    //     //把需要转账的租户，代售商户查询出来
    //     let tmpArray = [];//存放租户，代售商户对象的数组
    //     let tmpJson = {};
    //     let fn;
    //
    //     let paymentReqs = await PaymentReqs.findAll({
    //         where: {
    //             isFinish: true,
    //             isInvalid: false,
    //             paymentMethod: '微信',
    //             TransferAccountIsFinish: false,
    //             consigneeTransferAccountIsFinish: false
    //         }
    //     });
    //
    //     //遍历数据库 存储不同的主商户-代售商户
    //     for (var i = 0; i < paymentReqs.length; i++) {
    //         tmpJson.consigneeId = paymentReqs[i].consigneeId;
    //         tmpJson.tenantId = paymentReqs[i].tenantId;
    //         if (tmpArray.length == 0) {
    //             tmpArray.push(tmpJson);
    //         } else {
    //             if (Tool.jsonIsInArray(tmpArray, tmpJson) == false) {
    //                 tmpArray.push(tmpJson);
    //             }
    //         }
    //         tmpJson = {};
    //     }
    //     console.log("微信tmpArray.length:" + tmpArray.length);
    //
    //     let tenantId;
    //     let consigneeId;
    //     let tenantConfig;
    //     let consignee;
    //     if (tmpArray.length > 0) {
    //         for (var kk = 0; kk < tmpArray.length; kk++) {
    //             tenantId = tmpArray[kk].tenantId;
    //             consigneeId = tmpArray[kk].consigneeId;
    //             console.log("tenantId:" + tenantId);
    //             console.log("consigneeId:" + consigneeId);
    //
    //             //根据tenantId，consigneeId，订单号获取分成转账金额
    //             //input:tenantId,consigneeId,trade_no
    //             //output:object（总金额，租户金额，代售金额）
    //
    //             paymentReqs = await PaymentReqs.findAll({
    //                 where: {
    //                     tenantId: tenantId,
    //                     consigneeId: consigneeId,
    //                     paymentMethod: '微信',
    //                     isFinish: true,
    //                     isInvalid: false,
    //                     TransferAccountIsFinish: false,
    //                     consigneeTransferAccountIsFinish: false
    //                 }
    //             });
    //             let amountJson = {};
    //             let tmpAmountJson = {};
    //             tmpAmountJson.totalAmount = 0
    //             tmpAmountJson.merchantAmount = 0;
    //             tmpAmountJson.consigneeAmount = 0;
    //
    //             for (var i = 0; i < paymentReqs.length; i++) {
    //                 console.log("trade_no=======" + paymentReqs[i].trade_no);
    //                 amountJson = await amountManager.getTransAccountAmount(tenantId, consigneeId, paymentReqs[i].trade_no, '微信', paymentReqs[i].refund_amount);
    //                 console.log("amountJson = " + JSON.stringify(amountJson, null, 2));
    //
    //                 tmpAmountJson.totalAmount += (amountJson.totalAmount == null) ? 0 : amountJson.totalAmount;
    //                 tmpAmountJson.merchantAmount += (amountJson.merchantAmount == null) ? 0 : amountJson.merchantAmount;
    //                 tmpAmountJson.consigneeAmount += (amountJson.consigneeAmount == null) ? 0 : amountJson.consigneeAmount;
    //             }
    //
    //
    //             console.log("tmpAmountJson = " + JSON.stringify(tmpAmountJson, null, 2));
    //
    //             //查找主商户信息
    //             tenantConfig = await TenantConfigs.findOne({
    //                 where: {
    //                     tenantId: tenantId
    //                 }
    //             });
    //
    //             //查找代售商户信息
    //             consignee = await Consignees.findOne({
    //                 where: {
    //                     consigneeId: consigneeId
    //                 }
    //             });
    //
    //             console.log("主商户利润：" + tmpAmountJson.merchantAmount);
    //             console.log("代售商户利润：" + tmpAmountJson.consigneeAmount);
    //
    //             if (tenantConfig != null) {
    //                 console.log("服务器公网IP：" + ip);
    //                 fn = co.wrap(wxpay.transfers.bind(wxpay))
    //                 if (consignee == null) {
    //                     var params = {
    //                         partner_trade_no: Date.now(), //商户订单号，需保持唯一性
    //                         openid: tenantConfig.wecharPayee_account,
    //                         check_name: 'NO_CHECK',
    //                         amount: Math.round(tmpAmountJson.merchantAmount * 100),
    //                         desc: '日收益',
    //                         spbill_create_ip: ip
    //                     }
    //
    //                     try {
    //                         var result = await fn(params);
    //                         console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result, null, 2));
    //
    //                         if (result.result_code == 'SUCCESS') {
    //                             paymentReqs = await PaymentReqs.findAll({
    //                                 where: {
    //                                     tenantId: tenantId,
    //                                     consigneeId: consigneeId,
    //                                     paymentMethod: '微信',
    //                                     isFinish: true,
    //                                     isInvalid: false,
    //                                     TransferAccountIsFinish: false,
    //                                     consigneeTransferAccountIsFinish: false
    //                                 }
    //                             });
    //
    //                             for (var j = 0; j < paymentReqs.length; j++) {
    //                                 paymentReqs[j].TransferAccountIsFinish = true;
    //                                 await paymentReqs[j].save();
    //                             }
    //                             console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
    //                             console.log("每日微信转账记录0||tenantId:" + tenantId + " consignee:" + consignee + " merchantAmount:" + tmpAmountJson.merchantAmount);
    //                         }
    //                     } catch (e) {
    //                         console.log(e);
    //                     }
    //
    //                 } else {
    //                     let profitsharing = await ProfitSharings.findOne({
    //                         where: {
    //                             tenantId: tenantId,
    //                             consigneeId: consigneeId
    //                         }
    //                     });
    //                     if (profitsharing == null) {
    //                         var params = {
    //                             partner_trade_no: Date.now(), //商户订单号，需保持唯一性
    //                             openid: tenantConfig.wecharPayee_account,
    //                             check_name: 'NO_CHECK',
    //                             amount: Math.round(tmpAmountJson.merchantAmount * 100),
    //                             desc: '日收益',
    //                             spbill_create_ip: ip
    //                         }
    //
    //                         try {
    //                             var result = await fn(params);
    //                             console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT1result:" + JSON.stringify(result, null, 2));
    //                             if (result.result_code == 'SUCCESS') {
    //                                 paymentReqs = await PaymentReqs.findAll({
    //                                     where: {
    //                                         tenantId: tenantId,
    //                                         consigneeId: consigneeId,
    //                                         paymentMethod: '微信',
    //                                         isFinish: true,
    //                                         isInvalid: false,
    //                                         TransferAccountIsFinish: false,
    //                                         consigneeTransferAccountIsFinish: false
    //                                     }
    //                                 });
    //
    //                                 for (var j = 0; j < paymentReqs.length; j++) {
    //                                     paymentReqs[j].TransferAccountIsFinish = true;
    //                                     await paymentReqs[j].save();
    //                                 }
    //                                 console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
    //                                 console.log("每日微信转账记录1||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + tmpAmountJson.merchantAmount);
    //
    //                             }
    //                         } catch (e) {
    //                             console.log(e);
    //                         }
    //                     } else {
    //                         console.log("tmpAmountJson.merchantAmount * 100 ===" + tmpAmountJson.merchantAmount * 100);
    //                         console.log("tmpAmountJson.consigneeAmount * 100 ===" + tmpAmountJson.consigneeAmount * 100);
    //
    //                         var params = {
    //                             partner_trade_no: Date.now(), //商户订单号，需保持唯一性
    //                             openid: tenantConfig.wecharPayee_account,
    //                             check_name: 'NO_CHECK',
    //                             amount: Math.round(tmpAmountJson.merchantAmount * 100),
    //                             desc: profitsharing.merchantRemark,
    //                             spbill_create_ip: ip
    //                         }
    //
    //                         try {
    //                             var result1 = await fn(params);
    //                             console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT2result:" + JSON.stringify(result1, null, 2));
    //                             console.log("result.result_code:" + result1.result_code);
    //                             if (result1.result_code == 'SUCCESS') {
    //                                 paymentReqs = await PaymentReqs.findAll({
    //                                     where: {
    //                                         tenantId: tenantId,
    //                                         consigneeId: consigneeId,
    //                                         paymentMethod: '微信',
    //                                         isFinish: true,
    //                                         isInvalid: false,
    //                                         TransferAccountIsFinish: false,
    //                                         consigneeTransferAccountIsFinish: false
    //                                     }
    //                                 });
    //
    //                                 for (var jj = 0; jj < paymentReqs.length; jj++) {
    //                                     paymentReqs[jj].TransferAccountIsFinish = true;
    //                                     await paymentReqs[jj].save();
    //                                 }
    //
    //                                 params = {
    //                                     partner_trade_no: Date.now(), //商户订单号，需保持唯一性
    //                                     openid: consignee.wecharPayee_account,
    //                                     check_name: 'NO_CHECK',
    //                                     amount: Math.round(tmpAmountJson.consigneeAmount * 100),
    //                                     desc: profitsharing.consigneeRemark,
    //                                     spbill_create_ip: ip
    //                                 }
    //
    //                                 var result2 = await fn(params);
    //                                 console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3result:" + JSON.stringify(result2, null, 2));
    //
    //                                 if (result2.result_code == 'SUCCESS') {
    //                                     for (var jj = 0; jj < paymentReqs.length; jj++) {
    //                                         paymentReqs[jj].consigneeTransferAccountIsFinish = true;
    //                                         await paymentReqs[jj].save();
    //                                     }
    //                                 }
    //                                 console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
    //                                 console.log("每日微信转账记录2||tenantId:" + tenantId + " merchantAmount:" + tmpAmountJson.merchantAmount + " consigneeId:" + consigneeId + " consigneeAmount:" + tmpAmountJson.consigneeAmount);
    //                             }
    //                         } catch (e) {
    //                             console.log(e);
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //
    // }
    //
    // let aliTransferAccounts = async function () {
    //     //把需要转账的租户，代售商户查询出来
    //     let tmpArray = [];//存放租户，代售商户对象的数组
    //     let tmpJson = {};
    //
    //     let paymentReqs = await PaymentReqs.findAll({
    //         where: {
    //             isFinish: true,
    //             isInvalid: false,
    //             paymentMethod: '支付宝',
    //             TransferAccountIsFinish: false,
    //             consigneeTransferAccountIsFinish: false
    //         }
    //     });
    //
    //     //遍历数据库 存储不同的主商户-代售商户
    //     for (var i = 0; i < paymentReqs.length; i++) {
    //         tmpJson.consigneeId = paymentReqs[i].consigneeId;
    //         tmpJson.tenantId = paymentReqs[i].tenantId;
    //         if (tmpArray.length == 0) {
    //             tmpArray.push(tmpJson);
    //         } else {
    //             if (Tool.jsonIsInArray(tmpArray, tmpJson) == false) {
    //                 tmpArray.push(tmpJson);
    //             }
    //         }
    //         tmpJson = {};
    //     }
    //     console.log("支付宝tmpArray.length:" + tmpArray.length);
    //
    //     let tenantId;
    //     let consigneeId;
    //     let tenantConfig;
    //     let consignee;
    //     if (tmpArray.length > 0) {
    //         for (var kk = 0; kk < tmpArray.length; kk++) {
    //             tenantId = tmpArray[kk].tenantId;
    //             consigneeId = tmpArray[kk].consigneeId;
    //
    //             console.log("tenantId:" + tenantId);
    //             console.log("consigneeId:" + consigneeId);
    //
    //             //根据tenantId，consigneeId，订单号获取分成转账金额
    //             //input:tenantId,consigneeId,trade_no
    //             //output:object（总金额，租户金额，代售金额）
    //
    //             paymentReqs = await PaymentReqs.findAll({
    //                 where: {
    //                     tenantId: tenantId,
    //                     consigneeId: consigneeId,
    //                     paymentMethod: '支付宝',
    //                     isFinish: true,
    //                     isInvalid: false,
    //                     TransferAccountIsFinish: false,
    //                     consigneeTransferAccountIsFinish: false
    //                 }
    //             });
    //             let amountJson = {};
    //             let tmpAmountJson = {};
    //             tmpAmountJson.totalAmount = 0
    //             tmpAmountJson.merchantAmount = 0;
    //             tmpAmountJson.consigneeAmount = 0;
    //
    //             for (var i = 0; i < paymentReqs.length; i++) {
    //                 console.log("trade_no=======" + paymentReqs[i].trade_no);
    //                 amountJson = await amountManager.getTransAccountAmount(tenantId, consigneeId, paymentReqs[i].trade_no, '支付宝', paymentReqs[i].refund_amount);
    //                 console.log("amountJson = " + JSON.stringify(amountJson, null, 2));
    //
    //                 tmpAmountJson.totalAmount += (amountJson.totalAmount == null) ? 0 : amountJson.totalAmount;
    //                 tmpAmountJson.merchantAmount += (amountJson.merchantAmount == null) ? 0 : amountJson.merchantAmount;
    //                 tmpAmountJson.consigneeAmount += (amountJson.consigneeAmount == null) ? 0 : amountJson.consigneeAmount;
    //             }
    //
    //             console.log("tmpAmountJson = " + JSON.stringify(tmpAmountJson, null, 2));
    //
    //
    //             //查找主商户信息
    //             tenantConfig = await TenantConfigs.findOne({
    //                 where: {
    //                     tenantId: tenantId
    //                 }
    //             });
    //
    //             //查找代售商户信息
    //             consignee = await Consignees.findOne({
    //                 where: {
    //                     consigneeId: consigneeId
    //                 }
    //             });
    //
    //             console.log("主商户利润：" + tmpAmountJson.merchantAmount);
    //             console.log("代售商户利润：" + tmpAmountJson.consigneeAmount);
    //
    //             if (tenantConfig != null) {
    //                 if (consignee == null) {
    //                     var result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, tmpAmountJson.merchantAmount, null, '日收益', tenantId);
    //                     console.log("无代售0:" + JSON.stringify(result, null, 2));
    //                     if (result.msg == 'Success') {
    //                         paymentReqs = await PaymentReqs.findAll({
    //                             where: {
    //                                 tenantId: tenantId,
    //                                 consigneeId: consigneeId,
    //                                 paymentMethod: '支付宝',
    //                                 isFinish: true,
    //                                 isInvalid: false,
    //                                 TransferAccountIsFinish: false,
    //                                 consigneeTransferAccountIsFinish: false
    //                             }
    //                         });
    //
    //                         for (var j = 0; j < paymentReqs.length; j++) {
    //                             paymentReqs[j].TransferAccountIsFinish = true;
    //                             await paymentReqs[j].save();
    //                         }
    //                         console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
    //                         console.log("每日转账记录0||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + tmpAmountJson.merchantAmount);
    //                     }
    //
    //                 } else {
    //                     var profitsharing = await ProfitSharings.findOne({
    //                         where: {
    //                             tenantId: tenantId,
    //                             consigneeId: consigneeId
    //                         }
    //                     });
    //                     if (profitsharing == null) {
    //                         var result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, tmpAmountJson.merchantAmount, null, '日收益', tenantId);
    //                         console.log("无代售1:" + JSON.stringify(result, null, 2));
    //                         if (result.msg == 'Success') {
    //                             paymentReqs = await PaymentReqs.findAll({
    //                                 where: {
    //                                     tenantId: tenantId,
    //                                     consigneeId: consigneeId,
    //                                     paymentMethod: '支付宝',
    //                                     isFinish: true,
    //                                     isInvalid: false,
    //                                     TransferAccountIsFinish: false,
    //                                     consigneeTransferAccountIsFinish: false
    //                                 }
    //                             });
    //
    //                             for (var j = 0; j < paymentReqs.length; j++) {
    //                                 paymentReqs[j].TransferAccountIsFinish = true;
    //                                 await paymentReqs[j].save();
    //                             }
    //                             console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
    //                             console.log("每日转账记录1||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + tmpAmountJson.merchantAmount);
    //                         }
    //                     } else {
    //                         var ret1 = await transAccountsManager.transferAccounts(tenantConfig.payee_account, tmpAmountJson.merchantAmount, null, profitsharing.merchantRemark, tenantId);
    //                         if (ret1.msg == 'Success') {
    //                             paymentReqs = await PaymentReqs.findAll({
    //                                 where: {
    //                                     tenantId: tenantId,
    //                                     consigneeId: consigneeId,
    //                                     paymentMethod: '支付宝',
    //                                     isFinish: true,
    //                                     isInvalid: false,
    //                                     TransferAccountIsFinish: false,
    //                                     consigneeTransferAccountIsFinish: false
    //                                 }
    //                             });
    //
    //                             for (var jj = 0; jj < paymentReqs.length; jj++) {
    //                                 paymentReqs[jj].TransferAccountIsFinish = true;
    //                                 await paymentReqs[jj].save();
    //                             }
    //
    //
    //                             var ret2 = await transAccountsManager.transferAccounts(consignee.payee_account, tmpAmountJson.consigneeAmount, null, profitsharing.consigneeRemark, tenantId);
    //                             if (ret2.msg == 'Success') {
    //                                 for (var jj = 0; jj < paymentReqs.length; jj++) {
    //                                     paymentReqs[jj].consigneeTransferAccountIsFinish = true;
    //                                     await paymentReqs[jj].save();
    //                                 }
    //                             } else {
    //                                 console.log("代售商户转账失败：" + JSON.stringify(ret2, null, 2));
    //                             }
    //
    //                             console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
    //                             console.log("每日转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " consigneeAmount:" + tmpAmountJson.consigneeAmount);
    //                         } else {
    //                             console.log("主商户转账失败：" + JSON.stringify(ret1, null, 2))
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }

    //代售订单超时
    let orderInvalid = async function () {
        let rule = new schedule.RecurrenceRule();
        let times = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
        rule.minute = times;

        //5分钟订单失效检查,代售点的订单10分钟失效，购物车也是
        schedule.scheduleJob(rule, async function () {
            var orders = await Orders.findAll({
                where: {
                    $or: [{status: 0}, {status: 1}],
                    'consigneeId': {
                        $ne: null
                    }
                }
            });
            var trade_no;
            for (var i = 0; i < orders.length; i++) {
                if ((Date.now() - orders[i].createdAt.getTime()) > 10 * 60 * 1000) {
                    //获取订单号
                    trade_no = orders[i].trade_no;
                    console.log("超时订单号：" + trade_no)


                    await orders[i].destroy();

                    var paymentReqs = await PaymentReqs.findAll({
                        where: {
                            trade_no: trade_no,
                            isFinish: false,
                            isInvalid: false
                        }
                    });
                    if (paymentReqs.length > 0) {
                        for (var i = 0; i < paymentReqs.length; i++) {
                            paymentReqs[i].isInvalid = true;
                            await paymentReqs[i].save();
                            console.log("超时订单号支付请求表失效成功！")
                        }
                    }
                }
            }
        });

    }

    //点餐订单超时
    let dealOrderInvalid = async function () {
        let rule = new schedule.RecurrenceRule();
        let times = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
        rule.minute = times;

        //5分钟订单失效检查,代售点的订单10分钟失效，购物车也是
        schedule.scheduleJob(rule, async function () {
            var orders = await Orders.findAll({
                where: {
                    $or: [{status: 0}, {status: 1}],
                    'consigneeId': null
                }
            });
            var trade_no;
            for (var i = 0; i < orders.length; i++) {
                var tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: orders[i].tenantId
                    }
                });
                if (tenantConfig.invaildTime == 0 && tenantConfig.invaildTime == null) {
                    continue;
                }

                if ((Date.now() - orders[i].createdAt.getTime()) > tenantConfig.invaildTime) {
                    //获取订单号
                    trade_no = orders[i].trade_no;
                    console.log("点餐超时订单号：" + trade_no)

                    await orders[i].destroy();

                    //修改桌状态
                    //获取tableId
                    let table = await Tables.findOne({
                        where: {
                            tenantId: orders[i].tenantId,
                            id: orders[i].TableId,
                        }
                    });
                    table.status = 0;
                    await table.save();

                    var paymentReqs = await PaymentReqs.findAll({
                        where: {
                            trade_no: trade_no,
                            isFinish: false,
                            isInvalid: false
                        }
                    });
                    if (paymentReqs.length > 0) {
                        for (var i = 0; i < paymentReqs.length; i++) {
                            paymentReqs[i].isInvalid = true;
                            await paymentReqs[i].save();
                            console.log("点餐超时订单号支付请求表失效成功！")
                        }
                    }
                }
            }
        });

    }

    //购物车超时
    let shoppingCartInvalid = async function () {
        let rule = new schedule.RecurrenceRule();
        let times = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
        rule.minute = times;

        //5分钟购物车失效检查,代售点购物车20分钟失效，
        schedule.scheduleJob(rule, async function () {

            var shoppingCarts = await ShoppingCarts.findAll({
                where: {
                    'consigneeId': {
                        $ne: null
                    }
                }
            });
            for (var i = 0; i < shoppingCarts.length; i++) {
                var tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: shoppingCarts[i].tenantId
                    }
                });
                if (tenantConfig.invaildTime == 0) {
                    continue;
                }

                if ((Date.now() - shoppingCarts[i].createdAt.getTime()) > tenantConfig.invaildTime) {
                    //获取订单号
                    console.log("购物车失效：手机号：" + shoppingCarts[i].phone);
                    console.log("购物车失效：租户ID：" + shoppingCarts[i].tenantId);
                    console.log("购物车失效：代售ID：" + shoppingCarts[i].consigneeId);

                    await shoppingCarts[i].destroy();
                }
            }
        });
    }

    //点餐购物车超时
    let dealShoppingCartInvalid = async function () {
        let rule = new schedule.RecurrenceRule();
        let times = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
        rule.minute = times;

        //5分钟购物车失效检查,代售点购物车20分钟失效，
        schedule.scheduleJob(rule, async function () {
            var shoppingCarts = await ShoppingCarts.findAll({
                where: {
                    'consigneeId': null
                }
            });
            for (var i = 0; i < shoppingCarts.length; i++) {
                var tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: shoppingCarts[i].tenantId
                    }
                });
                if (tenantConfig.invaildTime == 0 && tenantConfig.invaildTime == null) {
                    continue;
                }

                if ((Date.now() - shoppingCarts[i].createdAt.getTime()) > tenantConfig.invaildTime) {
                    //获取订单号
                    console.log("点餐购物车失效：租户ID：" + shoppingCarts[i].tenantId);

                    await shoppingCarts[i].destroy();

                    //修改桌状态
                    //获取tableId
                    let table = await Tables.findOne({
                        where: {
                            tenantId: shoppingCarts[i].tenantId,
                            id: shoppingCarts[i].TableId,
                        }
                    });
                    table.status = 0;
                    await table.save();
                }
            }
        });
    }

    //已支付订单不删除
    let OrderNotInvalid = async function () {
        let rule = new schedule.RecurrenceRule();
        let times = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
        rule.minute = times;

        //5分钟订单失效检查,代售点的订单10分钟失效，购物车也是
        schedule.scheduleJob(rule, async function () {
            await Orders.update({
                deletedAt: null
            }, {
                where: {
                    status: {
                        $gte: 2
                    },
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false
            });
        });

    }

    await timeTransferAccounts();
    await orderInvalid();
    await shoppingCartInvalid();
    await dealOrderInvalid();
    await dealShoppingCartInvalid();
    //已支付订单取消删除
    await OrderNotInvalid();
}