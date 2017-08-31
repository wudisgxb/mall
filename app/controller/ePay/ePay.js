const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
const util = require('../alipay/util');
let path = require('path');
let Tool = require('../../Tool/tool');
const fs = require('fs');
const Alipay = require('../alipay/index');
const TenantConfigs = db.models.TenantConfigs;
const EPays = db.models.EPays;
const QRCodeTemplates = db.models.QRCodeTemplates;
const transAccountsManager = require('../alipay/transferAccounts')
const transAccounts = require('../customer/transAccount')
const config = require('../../config/config');
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
    notify_url: config.alipay.ePay_notify_url,
    return_url: config.alipay.ePay_return_url,
    rsaPrivate: path.resolve('./app/config/file/pem/sandbox_iobox_private.pem'),
    rsaPublic: path.resolve('./app/config/file/pem/sandbox_ali_public.pem'),
    sandbox: false,
    signType: 'RSA2'
});

module.exports = {
    async getEPayAlipayReq (ctx, next) {
        ctx.checkQuery('qrcodeId').notEmpty();
        ctx.checkQuery('amount').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let amount = ctx.query.amount;
        let tradeNo = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);

        let qrCodeTemplates = await QRCodeTemplates.findAll({
            where: {
                QRCodeTemplateId: ctx.query.qrcodeId,
            }
        });

        if (qrCodeTemplates.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "二维码模板未找到！");
            return;
        }

        //查找主商户名称
        let tenantConfigs = await TenantConfigs.findOne({
            where: {
                tenantId: qrCodeTemplates.tenantId
            }
        });

        let merchant = tenantConfigs.name;

        let new_params = aliEPay.webPay({
            subject: merchant + '-' + '转账',
            body: '消费',
            outTradeId: tradeNo,
            timeout: '10m',
            amount: amount,
            goodsType: '1'
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
            tenantId: ctx.query.tenantId
        });

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)

    },

    async alipay(ctx, next) {
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
            let ePay = await EPays.findOne({
                where: {
                    trade_no: ret.out_trade_no,
                    app_id: ret.app_id,
                    totalAmount: parseFloat(ret.total_amount),
                    paymentMethod: '支付宝',
                    isFinish: false
                }
            });

            if (ePay != null) {
                //支付请求表 isFinish改成true
                ePay.isFinish = true;
                await ePay.save();

                let tenantId = ePay.tenantId;

                //查找主商户信息
                let tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: tenantId
                    }
                });
                if (tenantConfig != null) {
                    if (tenantConfig.isRealTime) {
                        let total_amount = ret.total_amount
                        let result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, total_amount, null, '收益', tenantId);
                        console.log('1111||' + result);
                        if (result.msg == 'Success') {
                            ePay.TransferAccountIsFinish = true;
                            await ePay.save();
                        } else {
                            if (total_amount > 0) {
                                await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, total_amount, '收益', '支付宝', '租户', tenantId, null);
                            }
                        }
                    } else {
                        if (total_amount > 0) {
                            await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, total_amount, '收益', '支付宝', '租户', tenantId, null);
                        }
                    }
                } else {
                    console.log("tenantConfig为空");
                }


            } else {
                console.log("signFlag==" + signFlag);
                console.log("errRsp==" + JSON.stringify(response));
            }
        }
        //必须返回success
        ctx.body = "success";
    },

    async ePayRedirect(ctx, next) {
        //const path = ctx.query.path
        //初始回调地址前台做转发用不用改
        const auth_callback_url = `http://deal.xiaovbao.cn/wechatpay`

        // const auth_callback_url = 'http://119.29.180.92/user'

        console.log(`auth_callback_url: ${auth_callback_url}`)

        const url = client.getAuthorizeURL(auth_callback_url, config.wechat.ePayState, 'snsapi_base');
        console.log(`redirect url: ${url}`)
        // 重定向请求到微信服务器
        //ctx.redirect(url);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, url)
        console.log(`start: ${new Date()}`)
    },

    async getEPayWechatpayReq(ctx, next) {
        ctx.checkQuery('code').notEmpty();
        ctx.checkQuery('qrcodeId').notEmpty();
        ctx.checkQuery('amount').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let amount = ctx.query.amount;
        let tradeNo = new Date().format("yyyyMMddhhmmssS") + parseInt(Math.random() * 8999 + 1000);

        let qrCodeTemplates = await QRCodeTemplates.findAll({
            where: {
                QRCodeTemplateId: ctx.query.qrcodeId,
            }
        });

        if (qrCodeTemplates.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "二维码模板未找到！");
            return;
        }

        //查找主商户名称
        let tenantConfigs = await TenantConfigs.findOne({
            where: {
                tenantId: qrCodeTemplates.tenantId
            }
        });

        let merchant = tenantConfigs.name;

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
            params: new_params,
            paymentMethod: '微信',
            isFinish: false,
            trade_no: tradeNo,
            app_id: app_id,
            totalAmount: total_amount,
            tenantId: ctx.query.tenantId
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

        let trade_no = xml.out_trade_no.toString().substr(0, xml.out_trade_no.toString().length - 4);

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
                    total_amount: total_amount,
                    paymentMethod: '微信',
                    isFinish: false
                }
            });

            if (ePay != null) {
                ePay.isFinish = true;
                await ePay.save();

                let tenantId = ePay.tenantId;

                //查找主商户信息
                let tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: tenantId
                    }
                });

                if (tenantConfig != null) {
                    if (tenantConfig.isRealTime) {
                        console.log("服务器公网IP：" + ip);
                        let params;
                        let result;
                        fn = co.wrap(wxpay.transfers.bind(wxpay))

                        //找到对应关系
                        console.log("主商户分润：" + total_amount);
                        params = {
                            partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                            openid: tenantConfig.wecharPayee_account,
                            check_name: 'NO_CHECK',
                            amount: Math.round(total_amount * 100),
                            desc: "收益",
                            spbill_create_ip: ip
                        }

                        try {
                            result = await fn(params);
                            console.log("11result:" + JSON.stringify(result, null, 2));
                            if (result.result_code == 'SUCCESS') {
                                ePay.TransferAccountIsFinish = true;
                                await ePay.save();

                            } else {
                                if (total_amount > 0) {
                                    await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, total_amount, "收益", '微信', '租户', tenantId, null);
                                }
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    } else {
                        if (total_amount > 0) {
                            await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, total_amount, '收益', '微信', '租户', tenantId, null);
                        }

                    }
                } else {
                    console.log("tenantConfig为空");
                }
            } else {
                console.log("signFlag==" + 1);
                console.log("errRsp==" + JSON.stringify(ctx.xmlBody));
            }
        }

        ctx.body = "SUCCESS";
    },
}