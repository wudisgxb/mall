const myAlipay = require('../controller/alipay/index');
const request = require('request');
const schedule = require("node-schedule");
const Tool = require('../Tool/tool');

var transAccountsManager = require('../controller/alipay/transferAccounts');
var fs = require('fs');
const path = require('path');
const db = require('../db/mysql/index');
const Orders = db.models.Orders;
const PaymentReqs = db.models.PaymentReqs;
const Consignees = db.models.Consignees;
const TenantConfigs = db.models.TenantConfigs;
const ProfitSharings = db.models.ProfitSharings;

const co = require('co')
const WXPay = require('co-wechat-payment')
const ip = require('ip').address();

const wxpay = new WXPay({
    appId: 'wx09b412b006792e2c',
    mchId: '1456240202',
    partnerKey: 'EXvIG4rOpC7AlcooAFkoMAgWIoYa1VbR', //微信商户平台API密钥
    pfx: fs.readFileSync('./app/controller/wechatPay/apiclient_cert.p12'), //微信商户平台证书
})


module.exports = async function tasks(app) {
    let timeTransferAccounts = function () {
        let rule = new schedule.RecurrenceRule();

        rule.dayOfWeek = [0, new schedule.Range(1, 6)];

        rule.hour = 5;

        rule.minute = 1;
        rule.second = 1;
        schedule.scheduleJob(rule, async function(){
            await aliTransferAccounts();
            await wechatTransferAccounts();
        });
    }

    let wechatTransferAccounts = async function () {
        //把需要转账的租户，代售商户查询出来
        let tmpArray = [];//存放租户，代售商户对象的数组
        let tmpJson = {};
        let actual_amounts = 0;
        let totalAmount = 0;//原收金额
        let fn;

        let paymentReqs = await PaymentReqs.findAll({
            where: {
                isFinish : true,
                isInvalid : false,
                paymentMethod :'微信',
                TransferAccountIsFinish:false,
                consigneeTransferAccountIsFinish:false
            }
        });

        //遍历数据库 存储不同的主商户-代售商户
        for (var i = 0;i<paymentReqs.length;i++) {
            tmpJson.consigneeId = paymentReqs[i].consigneeId;
            tmpJson.tenantId =  paymentReqs[i].tenantId;
            if (tmpArray.length ==0) {
                tmpArray.push(tmpJson);
            } else {
                if(Tool.jsonIsInArray(tmpArray,tmpJson) == false) {
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
            for (var kk = 0;kk<tmpArray.length;kk++) {
                tenantId = tmpArray[kk].tenantId;
                consigneeId= tmpArray[kk].consigneeId;
                console.log("tenantId:" + tenantId);
                console.log("consigneeId:" + consigneeId);
                actual_amounts = await PaymentReqs.sum(
                    'actual_amount',
                    {
                        where: {
                            tenantId:tenantId,
                            consigneeId:consigneeId,
                            paymentMethod :'微信',
                            isFinish : true,
                            isInvalid : false,
                            TransferAccountIsFinish:false,
                            consigneeTransferAccountIsFinish:false
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

                //无手续费
                // var total_amount = Math.round(actual_amounts*99.4)/100;
                var total_amount = actual_amounts;

                console.log("实收金额：" + actual_amounts);

                if (tenantConfig != null) {
                    console.log("服务器公网IP：" + ip);
                    fn = co.wrap(wxpay.transfers.bind(wxpay))
                    if (consignee == null) {
                        var  params = {
                            partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                            openid : tenantConfig.wecharPayee_account,
                            check_name: 'NO_CHECK',
                            amount: total_amount*100,
                            desc: '日收益',
                            spbill_create_ip: ip
                        }

                        try {
                            var result = await fn(params);
                            console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result,null,2));

                            if(result.result_code == 'SUCCESS') {
                                paymentReqs = await PaymentReqs.findAll({
                                    where: {
                                        tenantId: tenantId,
                                        consigneeId: consigneeId,
                                        paymentMethod :'微信',
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
                                console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                console.log("每日微信转账记录0||tenantId:" + tenantId + " consignee:" + consignee + " actual_amounts:" + actual_amounts);
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
                            var  params = {
                                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                openid : tenantConfig.wecharPayee_account,
                                check_name: 'NO_CHECK',
                                amount: total_amount*100,
                                desc: '日收益',
                                spbill_create_ip: ip
                            }

                            try {
                                var result = await fn(params);
                                console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT1result:" + JSON.stringify(result,null,2));
                                if(result.result_code == 'SUCCESS') {
                                    paymentReqs = await PaymentReqs.findAll({
                                        where: {
                                            tenantId: tenantId,
                                            consigneeId: consigneeId,
                                            paymentMethod :'微信',
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
                                    console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                    console.log("每日微信转账记录1||tenantId:" + tenantId + " consigneeId:" + consigneeId + " actual_amounts:" + actual_amounts);

                                }
                            } catch (e) {
                                console.log(e);
                            }
                        } else {
                            //找到对应关系
                            var amount = total_amount * (1-profitsharing.rate-profitsharing.ownRate); //主商户提成
                            amount = Math.round(amount*100)/100;
                            console.log("主商户分润：" + amount);
                            var  params = {
                                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                openid : tenantConfig.wecharPayee_account,
                                check_name: 'NO_CHECK',
                                amount: amount * 100,
                                desc: profitsharing.merchantRemark,
                                spbill_create_ip: ip
                            }

                            try{
                                var result1 = await fn(params);
                                console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT2result:" + JSON.stringify(result1,null,2));
                                console.log("result.result_code:" + result1.result_code);
                                if (result1.result_code == 'SUCCESS') {
                                    paymentReqs = await PaymentReqs.findAll({
                                        where: {
                                            tenantId:tenantId,
                                            consigneeId:consigneeId,
                                            paymentMethod :'微信',
                                            isFinish : true,
                                            isInvalid : false,
                                            TransferAccountIsFinish:false,
                                            consigneeTransferAccountIsFinish:false
                                        }
                                    });

                                    for (var jj = 0 ;jj<paymentReqs.length;jj++) {
                                        paymentReqs[jj].TransferAccountIsFinish = true;
                                        await paymentReqs[jj].save();
                                    }

                                    //主商户转账成功才能给代售商户转账
                                    var consignee_amount = total_amount * profitsharing.rate;//代售商户
                                    consignee_amount = Math.round(consignee_amount*100)/100;
                                    console.log("代售点分润：" + consignee_amount);
                                    params = {
                                        partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                        openid : consignee.wecharPayee_account,
                                        check_name: 'NO_CHECK',
                                        amount: consignee_amount*100,
                                        desc: profitsharing.consigneeRemark,
                                        spbill_create_ip: ip
                                    }

                                    var result2 = await fn(params);
                                    console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3result:" + JSON.stringify(result2,null,2));

                                    if (result2.result_code == 'SUCCESS') {
                                        for (var jj = 0 ;jj<paymentReqs.length;jj++) {
                                            paymentReqs[jj].consigneeTransferAccountIsFinish = true;
                                            await paymentReqs[jj].save();
                                        }
                                    }
                                    console.log("转账时间:",new Date().format('yyyy-MM-dd hh:mm:ss'));
                                    console.log("每日微信转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " actual_amounts:" + actual_amounts);
                                }
                            } catch(e) {
                                console.log(e);
                            }

                        }
                    }
                }
                actual_amounts = 0;
            }
        }

    }

    let aliTransferAccounts = async function () {
        const  ali = new myAlipay({
            appId: '2017053107387940',
            notify_url: 'http://deal.xiaovbao.cn/api/v2/alipay',
            return_url: 'http://deal.xiaovbao.cn/alipay-callback',
            rsaPrivate: path.resolve('./app/controller/file/pem/sandbox_iobox_private.pem'),
            rsaPublic: path.resolve('./app/controller/file/pem/sandbox_ali_public.pem'),
            sandbox: false,
            signType: 'RSA2'
        });

        //把需要转账的租户，代售商户查询出来
        let tmpArray = [];//存放租户，代售商户对象的数组
        let tmpJson = {};
        let actual_amounts = 0;
        let totalAmount = 0;//原收金额

        let paymentReqs = await PaymentReqs.findAll({
            where: {
                isFinish : true,
                isInvalid : false,
                paymentMethod :'支付宝',
                TransferAccountIsFinish:false,
                consigneeTransferAccountIsFinish:false
            }
        });

        //遍历数据库 存储不同的主商户-代售商户
        for (var i = 0;i<paymentReqs.length;i++) {
            tmpJson.consigneeId = paymentReqs[i].consigneeId;
            tmpJson.tenantId =  paymentReqs[i].tenantId;
            if (tmpArray.length ==0) {
                tmpArray.push(tmpJson);
            } else {
                if(Tool.jsonIsInArray(tmpArray,tmpJson) == false) {
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
            for (var kk = 0;kk<tmpArray.length;kk++) {
                tenantId = tmpArray[kk].tenantId;
                consigneeId= tmpArray[kk].consigneeId;
                console.log("tenantId:" + tenantId);
                console.log("consigneeId:" + consigneeId);
                actual_amounts = await PaymentReqs.sum(
                    'actual_amount',
                    {
                        where: {
                            tenantId:tenantId,
                            consigneeId:consigneeId,
                            paymentMethod :'支付宝',
                            isFinish : true,
                            isInvalid : false,
                            TransferAccountIsFinish:false,
                            consigneeTransferAccountIsFinish:false
                        }
                    });

                totalAmount = await PaymentReqs.sum(
                    'total_amount',
                    {
                        where: {
                            tenantId:tenantId,
                            consigneeId:consigneeId,
                            paymentMethod :'支付宝',
                            isFinish : true,
                            isInvalid : false,
                            TransferAccountIsFinish:false,
                            consigneeTransferAccountIsFinish:false
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

                //四舍五入 千分之0.994转账
                // var total_amount = Math.round(actual_amounts*99.4)/100;
                //按原收价格收手续费
                var total_amount = actual_amounts - Math.round(totalAmount*0.6)/100;

                console.log("实收金额：" + actual_amounts);
                console.log("原收金额：" + totalAmount);
                console.log("除去支付宝手续费的总金额：" + JSON.stringify(total_amount));
                if (tenantConfig != null) {
                    if (consignee == null) {
                        var result = await transAccountsManager.transferAccounts(tenantConfig.payee_account,total_amount,null,'日收益',tenantId);
                        console.log("无代售0:" + JSON.stringify(result,null,2));
                        if (result.msg == 'Success') {
                            paymentReqs = await PaymentReqs.findAll({
                                where: {
                                    tenantId: tenantId,
                                    consigneeId: consigneeId,
                                    paymentMethod :'支付宝',
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
                            console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                            console.log("每日转账记录0||tenantId:" + tenantId + " consigneeId:" + consigneeId + " actual_amounts:" + actual_amounts);
                        }

                    } else {
                        var profitsharing = await ProfitSharings.findOne({
                            where: {
                                tenantId: tenantId,
                                consigneeId: consigneeId
                            }
                        });
                        if (profitsharing == null) {
                            var result = await transAccountsManager.transferAccounts(tenantConfig.payee_account,total_amount,null,'日收益',tenantId);
                            console.log("无代售1:" + JSON.stringify(result,null,2));
                            if (result.msg == 'Success') {
                                paymentReqs = await PaymentReqs.findAll({
                                    where: {
                                        tenantId: tenantId,
                                        consigneeId: consigneeId,
                                        paymentMethod :'支付宝',
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
                                console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                                console.log("每日转账记录1||tenantId:" + tenantId + " consigneeId:" + consigneeId + " actual_amounts:" + actual_amounts);
                            }
                        } else {
                            //找到对应关系
                            var amount = total_amount * (1-profitsharing.rate-profitsharing.ownRate); //主商户提成
                            amount = Math.round(amount*100)/100;
                            console.log("amount:" + amount);
                            var ret1 = await transAccountsManager.transferAccounts(tenantConfig.payee_account,amount,null,profitsharing.merchantRemark,tenantId);
                            if (ret1.msg == 'Success') {
                                paymentReqs = await PaymentReqs.findAll({
                                    where: {
                                        tenantId:tenantId,
                                        consigneeId:consigneeId,
                                        paymentMethod :'支付宝',
                                        isFinish : true,
                                        isInvalid : false,
                                        TransferAccountIsFinish:false,
                                        consigneeTransferAccountIsFinish:false
                                    }
                                });

                                for (var jj = 0 ;jj<paymentReqs.length;jj++) {
                                    paymentReqs[jj].TransferAccountIsFinish = true;
                                    await paymentReqs[jj].save();
                                }

                                var consignee_amount = total_amount * profitsharing.rate;//代售商户
                                consignee_amount = Math.round(consignee_amount*100)/100;
                                console.log("consignee_amount:" + consignee_amount);
                                var ret2 = await transAccountsManager.transferAccounts(consignee.payee_account,consignee_amount,null,profitsharing.consigneeRemark,tenantId);
                                if (ret2.msg == 'Success') {
                                    for (var jj = 0 ;jj<paymentReqs.length;jj++) {
                                        paymentReqs[jj].consigneeTransferAccountIsFinish = true;
                                        await paymentReqs[jj].save();
                                    }
                                } else {
                                    console.log("代售商户转账失败：" + JSON.stringify(ret2,null,2));
                                }

                                console.log("转账时间:",new Date().format('yyyy-MM-dd hh:mm:ss'));
                                console.log("每日转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " actual_amounts:" + actual_amounts);
                            } else {
                                console.log("主商户转账失败：" + JSON.stringify(ret1,null,2))
                            }
                        }
                    }
                }
                actual_amounts = 0;
            }
        }
    }
    
    let orderInvalid = async function () {
        let rule     = new schedule.RecurrenceRule();
        let times    = [1,6,11,16,21,26,31,36,41,46,51,56];
        rule.minute  = times;

        //5分钟订单失效检查,代售点的订单10分钟失效
        schedule.scheduleJob(rule, async function(){
            var orders = await Orders.findAll({
                where:{
                    $or:[{status:0},{status:1}],
                    'consigneeId':{
                        $ne:null
                    }
                }
            });
            var trade_no;
            for (var i = 0;i<orders.length;i++) {
                if((Date.now() - orders[i].createdAt.getTime()) > 10*60*1000) {
                    //获取订单号
                    trade_no = orders[i].trade_no;
                    console.log("超时订单号："+ trade_no)

                    await orders[i].destroy();

                    var paymentReqs = await PaymentReqs.findAll({
                        where:{
                            trade_no:trade_no,
                            isFinish:false,
                            isInvalid:false
                        }
                    });
                    if (paymentReqs.length >0) {
                        for(var i =0;i<paymentReqs.length;i++) {
                            paymentReqs[i].isInvalid = true;
                            await paymentReqs[i].save();
                            console.log("超时订单号支付请求表失效成功！")
                        }
                    }
                }
            }
        });

    }

    await timeTransferAccounts();
    await orderInvalid();

}