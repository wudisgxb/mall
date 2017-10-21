const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const co = require('co')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
const util = require('../alipay/util');
let path = require('path');
let Tool = require('../../Tool/tool');
const fs = require('fs');
const Alipay = require('../alipay/index');
const HeadquartersIntegrals =db.models.HeadquartersIntegrals
const Headquarters =db.models.Headquarters
const HeadquartersSetIntegrals = db.models.HeadquartersSetIntegrals
const AllianceIntegrals = db.models.AllianceIntegrals
const Merchants = db.models.Merchants
const PaymentReqs = db.models.PaymentReqs;
const TenantConfigs = db.models.TenantConfigs;

const AllianceHeadquarters = db.models.AllianceHeadquarters;
const EPays = db.models.EPays;
const QRCodeTemplates = db.models.QRCodeTemplates;
const Alliances = db.models.Alliances
// const AllianceIntegrals = db.models.AllianceIntegrals
const MerchantIntegrals = db.models.MerchantIntegrals
const AllianceSetIntegrals = db.models.AllianceSetIntegrals
const transAccountsManager = require('../alipay/transferAccounts')
const AllianceMerchants = db.models.AllianceMerchants
const transAccounts = require('../customer/transAccount')
const config = require('../../config/config');
const amountManager = require('../amount/amountManager')
const ip = require('ip').address();
const OAuth = require('co-wechat-oauth')
const WXPay = require('co-wechat-payment')
const client = new OAuth(config.wechat.appId, config.wechat.secret);

const wxpay = new WXPay({
    appId: config.wechat.appId,
    mchId: config.wechat.mchId,
    partnerKey: config.wechat.partnerKey, //微信商户平台API密钥
    pfx: fs.readFileSync('./app/config/apiclient_cert.p12'), //微信商户平台证书
})


const aliEPay = new Alipay({
    appId: config.alipay.appId,
    notify_url: config.alipay.iPay_notify_url,
    return_url: config.alipay.iPay_return_url,
    rsaPrivate: path.resolve('./app/config/file/pem/sandbox_iobox_private.pem'),
    rsaPublic: path.resolve('./app/config/file/pem/sandbox_ali_public.pem'),
    sandbox: false,
    signType: 'RSA2'
});

module.exports = {
    async getIPayAlipayReq (ctx, next) {
        ctx.checkQuery('qrcodeId').notEmpty();
        ctx.checkQuery('amount').notEmpty();
        // console.log("qrcodeId"+ctx.query.qrcodeId)
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let amount = ctx.query.amount;
        let tradeNo = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);

        let qrCodeTemplate = await QRCodeTemplates.findOne({
            where: {
                QRCodeTemplateId: ctx.query.qrcodeId,
            }
        });

        if (qrCodeTemplate  == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "二维码模板未找到！");
            return;
        }
        console.log(qrCodeTemplate)
        let merchantName
        if(qrCodeTemplate.bizType=="ipay"){
            console.log(1111111)
            let alliances = await Alliances.findOne({
                where: {
                    alliancesId: qrCodeTemplate.tenantId
                }
            });
            if(alliances==null){
                let merchant = await Merchants.findOne({
                    where :{
                        tenantId :qrCodeTemplate.tenantId
                    }
                })
                merchantName=merchant.name
            }
            else {
                merchantName = alliances.name
            }
        }
        //查找主商户名称
        let new_params = aliEPay.webPay({
            subject: merchantName + '-' + '转账',//商品的标题
            body: '消费',//对一笔交易的具体描述信息
            outTradeId: tradeNo,//商户网站唯一订单号
            timeout: '10m',//设置未付款支付宝交易的超时时间
            amount: amount,//订单总金额
            goodsType: '1'//商品主类型：0—虚拟类商品，1—实物类商品
        });

        console.log(decodeURIComponent(new_params));

        let app_id_tmp = decodeURIComponent(new_params).split('&')[0];
        let app_id = app_id_tmp.substring(app_id_tmp.indexOf('=') + 1, app_id_tmp.length);

        let biz_content = decodeURIComponent(new_params).split('&')[1];
        let biz_json = JSON.parse(biz_content.substring(biz_content.indexOf('=') + 1, biz_content.length));

        tradeNo = biz_json.out_trade_no;
        let total_amount = biz_json.total_amount;

        console.log("支付宝需要支付金额 ====" + total_amount);


        await EPays.create({
            params: new_params,
            paymentMethod: '支付宝',
            isFinish: false,
            trade_no: tradeNo,
            app_id: app_id,
            totalAmount: total_amount,
            tenantId: qrCodeTemplate.tenantId,
            isRecharge :true
        });

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)

    },

    async alipay(ctx, next) {
        console.log("----------------回调调用成功---------------------")
        let response = ctx.request.body;
        let tableId = 0;

        let ret = util.copy(response);
        let sign = ret['sign'];
        ret.sign = undefined;
        ret.sign_type = undefined;

        let tmp = util.encodeParams(ret);
        let rsaPublic = fs.readFileSync('./app/config/file/pem/sandbox_ali_public.pem', 'utf-8');
        let signFlag = util.signVerify(tmp.unencode, sign, rsaPublic, 'RSA2');

        if (signFlag == false) {
            console.log("signFlag==" + signFlag);
            console.log("errRsp==" + JSON.stringify(response));
        } else {
            console.log("trade_no=" + ret.out_trade_no);
            console.log("app_id=" + ret.app_id);
            console.log("total_amount=" + parseFloat(ret.total_amount));
            //根据订单号找充值的记录
            let ePay = await EPays.findOne({
                where: {
                    trade_no: ret.out_trade_no,
                    app_id: ret.app_id,
                    totalAmount: parseFloat(ret.total_amount),
                    paymentMethod: '支付宝',
                    isFinish: false,
                    isRecharge : true
                }
            });
            console.log("________________"+ePay+"---------------------")
            if (ePay != null) {
                console("ePay != null")
                //支付请求表 isFinish改成true
                ePay.isFinish = true;
                await ePay.save();
                let alliancesId = ePay.tenantId;
                let merchant = await Merchants.findOne({
                    where:{
                        tenantId : alliancesId
                    }
                })

                console.log(ret.total_amount)
                console.log(merchant==null?"商圈充值":merchant.name+"充值")
                console.log(ePay.paymentMethod)
                console.log(ret.out_trade_no)
                console.log(pay_date)
                // if(merchant!=null){
                //     let tenantConfig = await TenantConfigs.findOne({
                //         where:{
                //             tenantId:merchant.tenantId
                //         }
                //     })
                //     tenantConfig.wecharPayee_account
                //     let allianceMerchants = await AllianceMerchants.findOne({
                //         where:{
                //             tenantId:merchant.tenantId
                //         }
                //     })
                //     await transAccounts.pendingTransferAccounts(ret.out_trade_no, payee_account, amount, remark, paymentMethod, role, tenantId, consigneeId)
                // }


                await amountManager.rechargeIntegral(alliancesId,ret.total_amount);


                //商圈Id
                // let alliancesHeadquarters = await AllianceHeadquarters.findOne({
                //     where:{
                //         alliancesId:alliancesId
                //     }
                // })
                // let dealId
                // //判断这个付款的Id是谁的
                // if(alliancesHeadquarters!=null){
                //     //如果这个付款的alliancesId是商圈的，那么就是在平台充值
                //     dealId = alliancesHeadquarters.headquartersId
                //     //生成一个和商圈有关的平台Id
                //     let headquartersIntegralsId = "allH"+(Tool.allocTenantId().substring(4))
                //     //查询这个平台的积分设置
                //     let headquartersSetIntegrals = await HeadquartersSetIntegrals.findOne({
                //         where:{
                //             alliancesId : alliancesId
                //         }
                //     })
                //     //积分=总价格/积分配置的比率
                //     let integral = ret.total_amount/(Number(headquartersSetIntegrals.priceIntegralsRate))
                //     //平台的操作记录下来
                //     await HeadquartersIntegrals.create({
                //         headquartersIntegralsId : headquartersIntegralsId,
                //         headquartersId : dealId,
                //         buyOrSale : "0",//失去积分
                //         buyOrSaleMerchant : alliancesId,
                //         price : ret.total_amount,
                //         integral : integral,
                //     })
                //     let headquarters = await Headquarters.findOne({
                //         where:{
                //             headquartersId : dealId,
                //         }
                //     })
                //     let aggregateScoreHeadquarters = headquarters.aggregateScore-integral
                //     await Headquarters.update({
                //         aggregateScore : aggregateScoreHeadquarters
                //     },{
                //         where:{
                //             headquartersId : dealId,
                //         }
                //     })
                //
                //     //生成一个和平台有关的商圈Id
                //     let alliancesIntegralsId = "heaA"+(Tool.allocTenantId().substring(4))
                //     //将商圈的操作记录下来
                //     await AllianceIntegrals.create({
                //         allianceIntegralsId : alliancesIntegralsId,
                //         alliancesId : alliancesId,
                //         buyOrSale : "1",
                //         buyOrSaleMerchant:dealId,
                //         price:ret.total_amount,
                //         integral : integral,
                //     })
                //     let alliances = await Alliances.findOne({
                //         where:{
                //             alliancesId : alliancesId,
                //         }
                //     })
                //     let aggregateScoreAlliances = alliances.aggregateScore+integral
                //     await Alliances.update({
                //         aggregateScore : aggregateScoreAlliances
                //     },{
                //         where:{
                //             alliancesId : alliancesId,
                //         }
                //     })
                //
                //
                // }
                // if(alliancesHeadquarters==null){
                //     //如果没找到的话就说明这个付款的Id是租户的
                //     //查询商圈和租户的关联表查询到在那个商圈充值的
                //     let alliancesMerchant = await AllianceMerchants.findOne({
                //         where:{
                //             tenantId : alliancesId
                //         }
                //     })
                //     //获得商圈IdW
                //     dealId = alliancesMerchant.alliancesId
                //     //获得一个和租户有关的Id
                //     let alliancesIntegralsId = "tenA"+(Tool.allocTenantId().substring(4))
                //     //查询商圈设置的积分
                //     let allianceSetIntegrals = await AllianceSetIntegrals.findOne({
                //         where:{
                //             alliancesId : dealId
                //         }
                //     })
                //     //计算出购买的积分量
                //     let integral = ret.total_amount/(Number(allianceSetIntegrals.priceIntegralsRate))
                //     //新增商圈记录
                //     await AllianceIntegrals.create({
                //         alliancesIntegralsId : alliancesIntegralsId,
                //         alliancesId : dealId,
                //         buyOrSale : "0",//失去积分
                //         buyOrSaleMerchant : alliancesId,//给积分给那个租户
                //         price : ret.total_amount,
                //         integral : integral,
                //     })
                //     let alliance = await Alliances.findOne({
                //         where:{
                //             alliancesId : dealId
                //         }
                //     })
                //     let aggregateScoreAlliances = alliance.aggregateScore-integral
                //     await Alliances.update({
                //         aggregateScore : aggregateScoreAlliances
                //     },{
                //         where:{
                //             alliancesId : dealId
                //         }
                //     })
                //
                //     let merchantIntegralsId = "allM"+(Tool.allocTenantId().substring(4))
                //     await MerchantIntegrals.create({
                //         merchantIntegralsId : merchantIntegralsId,
                //         tenantId : alliancesId,
                //         buyOrSale : "1",
                //         buyOrSaleMerchant:dealId,
                //         price:ret.total_amount,
                //         integral : integral,
                //     })
                //     let merchant = await Merchants.findOne({
                //         where:{
                //             tenantId : alliancesId,
                //         }
                //     })
                //     let aggregateScoreMerchant = Number(merchant.aggregateScore)+integral
                //     await Merchants.update({
                //         aggregateScore : aggregateScoreMerchant
                //     },{
                //         where:{
                //             tenantId : alliancesId,
                //         }
                //     })
                // }

                // 查找主商户信息
                // let tenantConfig = await TenantConfigs.findOne({
                //     where: {
                //         tenantId: tenantId
                //     }
                // });
                // if (tenantConfig != null) {
                //     if (tenantConfig.isRealTime) {
                //         let total_amount = ret.total_amount
                //         let result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, total_amount, null, '收益', tenantId);
                //         console.log('1111||' + result);
                //         if (result.msg == 'Success') {
                //             ePay.TransferAccountIsFinish = true;
                //             await ePay.save();
                //         } else {
                //             if (total_amount > 0) {
                //                 await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, total_amount, '收益', '支付宝', '租户', tenantId, null);
                //             }
                //         }
                //     } else {
                //         if (total_amount > 0) {
                //             await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, total_amount, '收益', '支付宝', '租户', tenantId, null);
                //         }
                //     }
                // } else {
                //     console.log("tenantConfig为空");
                // }


            } else {
                console.log("signFlag==" + signFlag);
                console.log("errRsp==" + JSON.stringify(response));
            }
        }

        //必须返回success
        ctx.body = "success";
    },

    async iPayRedirect(ctx, next) {
        //const path = ctx.query.path
        //初始回调地址前台做转发用不用改
        const auth_callback_url = `http://deal.xiaovbao.cn/wechatpay`

        // const auth_callback_url = 'http://119.29.180.92/user'

        console.log(`auth_callback_url: ${auth_callback_url}`)

        const url = client.getAuthorizeURL(auth_callback_url, config.wechat.iPayState, 'snsapi_base');
        console.log(`redirect url: ${url}`)
        // 重定向请求到微信服务器
        //ctx.redirect(url);

        let urlArray = url.split("&")
        let c
        urlArray.forEach(function (e) {
            if(e.indexOf('#')!=-1){
                c=e.substring(0,e.indexOf('#'))
            }

        })
        console.log(urlArray)
        console.log(c)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, url)
        console.log(`start: ${new Date()}`)

    },

    async getIPayWechatpayReq(ctx, next) {
        ctx.checkQuery('code').notEmpty();
        ctx.checkQuery('qrcodeId').notEmpty();
        ctx.checkQuery('amount').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        // let amount = ctx.query.amount;
        let tradeNo = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);

        let qrCodeTemplate = await QRCodeTemplates.findOne({
            where: {
                QRCodeTemplateId: ctx.query.qrcodeId,
            }
        });

        if (qrCodeTemplate == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "二维码模板未找到！");
            return;
        }
        let merchantName;
        if(qrCodeTemplate.bizType=="Ipay"){
            let alliance = await Alliances.findOne({
                where: {
                    alliacesId: qrCodeTemplate.tenantId
                }
            });
            if(alliance != null){
                merchantName = alliance.name
            }
            if(alliance==null){
                let merchant = await Merchants.findOne({
                    where:{
                        tenantId : qrCodeTemplate.tenantId
                    }
                })
                merchantName = merchant.name
            }

        }

        //查找主商户名称


        let merchant = merchantName;

        let total_amount = ctx.query.amount;

        const fn = co.wrap(wxpay.getBrandWCPayRequestParams.bind(wxpay))

        console.log("total_amount ============" + total_amount);

        console.log(`code: ${ctx.query.code}`)
        const token = await client.getAccessToken(ctx.query.code)
        const ip = ctx.request.headers['x-real-ip']

        console.log(`openid: ${token.data.openid}; ip: ${ip}`)

        let new_params = await fn({
            openid: token.data.openid,
            body: merchant + '-' + '转账',
            out_trade_no: tradeNo,
            total_fee: parseFloat(total_amount) * 100,//分
            trade_type: 'JSAPI',
            spbill_create_ip: ip,
            notify_url: config.wechat.ePay_notify_url
        })
        new_params.trade_no = tradeNo;

        console.log(new_params)

        let app_id = new_params.appId;

        await EPays.create({
            params: JSON.stringify(new_params),
            paymentMethod: '微信',
            isFinish: false,
            trade_no: tradeNo,
            app_id: app_id,
            totalAmount: total_amount,
            tenantId: qrCodeTemplate.tenantId,
            isRecharge : true
        });

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)

    },

    async wechatPayNotify(ctx, next) {
        console.log(JSON.stringify(ctx.xmlBody));
        let xmlBody = ctx.xmlBody;

        let xml = xmlBody.xml;
        let tableId = 0;
        let str = "";
        let arr = Object.keys(xml);
        arr.forEach(function (e) {
            console.log(e + "||" + xml[e]);
            if (e != 'sign') {
                if (arr[arr.length - 1] != e) {
                    str = str + e + '=' + xml[e] + '&';
                } else {
                    str = str + e + '=' + xml[e] + '&' + 'key=EXvIG4rOpC7AlcooAFkoMAgWIoYa1VbR';
                }
            }
        })

        let fn = co.wrap(wxpay.getSign.bind(wxpay));
        const sign = await fn(str, 'MD5')

        let trade_no = xml.out_trade_no.toString();

        if (sign !== xml.sign[0]) {
            console.log("signFlag==" + 0);
            console.log("errRsp==" + JSON.stringify(ctx.xmlBody));
        } else {
            console.log(JSON.stringify({
                trade_no: trade_no,
                app_id: xml.appid,
                totalAmount: xml.total_fee / 100,
                paymentMethod: '微信',
                isFinish: false,
                isInvalid: false
            }, null, 2));

            console.log("trade_no=" + trade_no);
            console.log("app_id=" + xml.appid);
            console.log("total_amount=" + parseFloat(xml.total_fee));
            let total_amount = parseFloat(xml.total_fee) / 100;

            let ePay = await EPays.findOne({
                where: {
                    trade_no: trade_no,
                    app_id: xml.appid,
                    totalAmount: total_amount,
                    paymentMethod: '微信',
                    isFinish: false
                }
            });

            if (ePay != null) {
                ePay.isFinish = true;
                await ePay.save();

                let tenantId = ePay.tenantId;
                let merchant = await Merchants.findOne({
                    where:{
                        tenantId : tenantId
                    }
                })
                if(merchant!=null){
                    console.log(total_amount)
                    console.log(ePay.paymentMethod)
                    console.log(trade_no)
                    let tenantConfig = await TenantConfigs.findOne({
                        where: {
                            tenantId: tenantId
                        }
                    });
                    let allianceMerchants = await AllianceMerchants.findOne({
                        where:{
                            tenantId: tenantId
                        }
                    })
                    if(allianceMerchants!=null){
                        let alliances = await Alliances.findOne({
                           where:{
                               alliancesId:allianceMerchants.alliancesId
                           }
                        })
                        if(alliances!=null){
                            console.log("服务器公网IP：" + ip);
                            let params;
                            let result;
                            fn = co.wrap(wxpay.transfers.bind(wxpay))
                            params = {
                                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                openid: alliances.wecharPayee_account,
                                check_name: 'NO_CHECK',
                                amount: Math.round(total_amount * 100),
                                //desc: tenantConfig.remark,
                                desc: '收益',
                                spbill_create_ip: ip
                            }
                            try{
                                result = await fn(params);
                                console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result, null, 2));
                                if(result.result_code == 'SUCCESS'){
                                    ePay.TransferAccountIsFinish=true
                                    await ePay.save()
                                }else{
                                    if(total_amount>0){
                                        await transAccounts.pendingTransferAccounts(trade_no, alliances.wecharPayee_account, total_amount, '收益', '微信', '租户', alliances.alliancesId);
                                    }

                                }

                            }catch (e){
                                console.log(e)
                            }

                        }
                    }else{

                    }

                    await transAccounts.pendingTransferAccounts(trade_no,tenantConfig.payee_account,total_amount,merchant.name+"购买积分","微信","商户",tenantId,"")
                }
                await amountManager.rechargeIntegral(tenantId,total_amount)

                // if (tenantConfig != null) {
                //     if (tenantConfig.isRealTime) {
                //         console.log("服务器公网IP：" + ip);
                //         let params;
                //         let result;
                //         fn = co.wrap(wxpay.transfers.bind(wxpay))
                //
                //         //找到对应关系
                //         console.log("主商户分润：" + total_amount);
                //         params = {
                //             partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                //             openid: tenantConfig.wecharPayee_account,
                //             check_name: 'NO_CHECK',
                //             amount: Math.round(total_amount * 100),
                //             desc: "收益",
                //             spbill_create_ip: ip
                //         }
                //
                //         try {
                //             result = await fn(params);
                //             console.log("11result:" + JSON.stringify(result, null, 2));
                //             if (result.result_code == 'SUCCESS') {
                //                 ePay.TransferAccountIsFinish = true;
                //                 await ePay.save();
                //
                //             } else {
                //                 if (total_amount > 0) {
                //                     await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, total_amount, "收益", '微信', '租户', tenantId, null);
                //                 }
                //             }
                //         } catch (e) {
                //             console.log(e);
                //         }
                //     } else {
                //         if (total_amount > 0) {
                //             await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, total_amount, '收益', '微信', '租户', tenantId, null);
                //
                //         }
                //
                //     }
                // } else {
                //     console.log("tenantConfig为空");
                // }
            } else {
                console.log("signFlag==" + 1);
                console.log("errRsp==" + JSON.stringify(ctx.xmlBody));
            }
        }
        ctx.body = "SUCCESS";
    },


}
// let wechatTransferAccounts = async function () {
//     //把需要转账的租户，代售商户查询出来
//     let tmpArray = [];//存放租户，代售商户对象的数组
//     let tmpJson = {};
//     let merchantAmount = 0;//给租户的转账金额
//     let consigneeAmount = 0;//给代售的转账金额
//     let fn;
//     let paymentReqs;
//     let payDate = new Date().format("yyyyMMddhhmmss");
//
//     let transferAccounts = await TransferAccounts.findAll({
//         where: {
//             status: 0,
//             paymentMethod: '微信',
//         }
//     });
//
//     //遍历数据库 存储不同的主商户-代售商户
//     for (var i = 0; i < transferAccounts.length; i++) {
//         tmpJson.consigneeId = transferAccounts[i].consigneeId;
//         tmpJson.tenantId = transferAccounts[i].tenantId;
//         if (tmpArray.length == 0) {
//             tmpArray.push(tmpJson);
//         } else {
//             if (Tool.jsonIsInArray(tmpArray, tmpJson) == false) {
//                 tmpArray.push(tmpJson);
//             }
//         }
//         tmpJson = {};
//     }
//     console.log("代售商户tmpArray.length:" + tmpArray.length);
//
//     let tenantId;
//     let consigneeId;
//     let tenantConfig;
//     let consignee;
//     if (tmpArray.length > 0) {
//         for (var kkk = 0; kkk < tmpArray.length; kkk++) {
//             tenantId = tmpArray[kkk].tenantId;
//             consigneeId = tmpArray[kkk].consigneeId;
//             console.log("tenantId:" + tenantId);
//             console.log("consigneeId:" + consigneeId);
//             merchantAmount = await TransferAccounts.sum(
//                 'amount',
//                 {
//                     where: {
//                         tenantId: tenantId,
//                         consigneeId: consigneeId,
//                         paymentMethod: '微信',
//                         role: '租户',
//                         status: 0
//                     }
//                 });
//
//             consigneeAmount = await TransferAccounts.sum(
//                 'amount',
//                 {
//                     where: {
//                         tenantId: tenantId,
//                         consigneeId: consigneeId,
//                         paymentMethod: '微信',
//                         role: '代售',
//                         status: 0
//                     }
//                 });
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
//             console.log("租户微信转账金额：" + merchantAmount);
//             console.log("代售微信转账金额：" + consigneeAmount);
//             if (tenantConfig != null) {
//                 console.log("服务器公网IP：" + ip);
//                 fn = co.wrap(wxpay.transfers.bind(wxpay))
//                 if (consignee == null) {
//                     var params = {
//                         partner_trade_no: Date.now(), //商户订单号，需保持唯一性
//                         openid: tenantConfig.wecharPayee_account,
//                         check_name: 'NO_CHECK',
//                         amount: (merchantAmount * 100).toFixed(0),
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
//
//                             //待转账表状态修改从0-1
//                             transferAccounts = await TransferAccounts.findAll({
//                                 where: {
//                                     tenantId: tenantId,
//                                     consigneeId: consigneeId,
//                                     paymentMethod: '微信',
//                                     role: '租户',
//                                     status: 0
//                                 }
//                             })
//
//                             for (var k = 0; k < transferAccounts.length; k++) {
//                                 transferAccounts[k].status = 1;
//                                 transferAccounts[k].pay_date = payDate;
//                                 await transferAccounts[k].save();
//                             }
//
//                             console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
//                             console.log("每日微信转账记录0||tenantId:" + tenantId + " consignee:" + consignee + " merchantAmount:" + merchantAmount);
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
//                             amount: (merchantAmount * 100).toFixed(0),
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
//
//                                 transferAccounts = await TransferAccounts.findAll({
//                                     where: {
//                                         tenantId: tenantId,
//                                         consigneeId: consigneeId,
//                                         paymentMethod: '微信',
//                                         role: '租户',
//                                         status: 0
//                                     }
//                                 })
//
//                                 for (var k = 0; k < transferAccounts.length; k++) {
//                                     transferAccounts[k].status = 1;
//                                     transferAccounts[k].pay_date = payDate;
//                                     await transferAccounts[k].save();
//                                 }
//
//                                 console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
//                                 console.log("每日微信转账记录1||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + merchantAmount);
//
//                             }
//                         } catch (e) {
//                             console.log(e);
//                         }
//                     } else {
//                         console.log("主商户分润：" + merchantAmount);
//                         var params = {
//                             partner_trade_no: Date.now(), //商户订单号，需保持唯一性
//                             openid: tenantConfig.wecharPayee_account,
//                             check_name: 'NO_CHECK',
//                             amount: (merchantAmount * 100).toFixed(0),
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
//                                 transferAccounts = await TransferAccounts.findAll({
//                                     where: {
//                                         tenantId: tenantId,
//                                         consigneeId: consigneeId,
//                                         paymentMethod: '微信',
//                                         role: '租户',
//                                         status: 0
//                                     }
//                                 })
//
//                                 for (var kk = 0; kk < transferAccounts.length; kk++) {
//                                     transferAccounts[kk].status = 1;
//                                     transferAccounts[kk].pay_date = payDate;
//                                     await transferAccounts[kk].save();
//                                 }
//
//                                 if (consigneeAmount != null && consigneeAmount > 0) {
//                                     console.log("代售点分润：" + consigneeAmount);
//                                     params = {
//                                         partner_trade_no: Date.now(), //商户订单号，需保持唯一性
//                                         openid: consignee.wecharPayee_account,
//                                         check_name: 'NO_CHECK',
//                                         amount: (consigneeAmount * 100).toFixed(0),
//                                         desc: profitsharing.consigneeRemark,
//                                         spbill_create_ip: ip
//                                     }
//
//                                     var result2 = await fn(params);
//                                     console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3result:" + JSON.stringify(result2, null, 2));
//                                     console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
//                                     console.log("每日微信转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " merchantAmount:" + merchantAmount);
//                                     if (result2.result_code == 'SUCCESS') {
//                                         for (var jj = 0; jj < paymentReqs.length; jj++) {
//                                             paymentReqs[jj].consigneeTransferAccountIsFinish = true;
//                                             await paymentReqs[jj].save();
//                                         }
//
//                                         transferAccounts = await TransferAccounts.findAll({
//                                             where: {
//                                                 tenantId: tenantId,
//                                                 consigneeId: consigneeId,
//                                                 paymentMethod: '微信',
//                                                 role: '代售',
//                                                 status: 0
//                                             }
//                                         })
//
//                                         for (var kk = 0; kk < transferAccounts.length; kk++) {
//                                             transferAccounts[kk].status = 1;
//                                             transferAccounts[kk].pay_date = payDate;
//                                             await transferAccounts[kk].save();
//                                         }
//                                         console.log("每日微信转账记录2||tenantId:" + tenantId + " consigneeId:" + consigneeId + " consigneeAmount:" + consigneeAmount);
//                                     }
//                                 }
//
//                             }
//                         } catch (e) {
//                             console.log(e);
//                         }
//
//                     }
//                 }
//             }
//             merchantAmount = 0;
//             consigneeAmount = 0;
//         }
//     }
// }
