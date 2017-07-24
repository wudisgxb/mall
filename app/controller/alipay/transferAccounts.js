const myAlipay = require('./index');
const request = require('request');
const Promise = require('promise');

const path = require('path');
const db = require('../../db/mysql/index');
const TransferAccountInfos = db.models.TransferAccountInfos;
const config = require('../../config/config');

const transferAccountsManger = (function () {

    let transferAccounts = function (payee_account, amount, payee_real_name, remark, tenantId) {
        const myAli = new myAlipay({
            appId: config.alipay.appId,
            notify_url: 'http://deal.xiaovbao.cn/alipay',//暂时乱写的，没用到
            return_url: 'http://deal.xiaovbao.cn/alipay-callback',//暂时乱写的，没用到
            rsaPrivate: path.resolve('./app/controller/file/pem/sandbox_iobox_private.pem'),
            rsaPublic: path.resolve('./app/controller/file/pem/sandbox_ali_public.pem'),
            sandbox: false,
            signType: 'RSA2'
        });

        const myParmas = myAli.transferPay({
            payee_type: 'ALIPAY_LOGONID',
            payee_account: payee_account,
            amount: amount,
            payer_show_name: '南京腾宣威软件科技有限公司',
            //payee_real_name: payee_real_name,
            remark: remark
        });

        var url = 'https://openapi.alipay.com/gateway.do?' + myParmas;
        // var data = JSON.stringify({
        // });
        var opt = {
            rejectUnauthorized: false,
            url: url,
            method: 'POST',
            form: {
                data: null
            }
        };

        var promise = new Promise(function (resolve, reject) {
            request(opt, async function (err, data, mess) {
                if (err) {
                    console.log("888888888888888||" + err);
                    resolve(null);
                } else {
                    var rsp = JSON.parse(data.body).alipay_fund_trans_toaccount_transfer_response;
                    var url = "https://openapi.alipay.com/gateway.do?" + myAli.queryTransfer(rsp);
                    console.log("999999999999999999||" + rsp.msg);
                    if (rsp.msg == 'Success') {
                        await TransferAccountInfos.create({
                            code: rsp.code,
                            msg: rsp.msg,
                            order_id: rsp.order_id,
                            out_biz_no: rsp.out_biz_no,
                            pay_date: rsp.pay_date,
                            sub_code: "",
                            sub_msg: "",
                            transferAccountInfoUrl: url,
                            tenantId: tenantId
                        });
                    } else {
                        await TransferAccountInfos.create({
                            code: rsp.code,
                            msg: rsp.msg,
                            order_id: "",
                            out_biz_no: rsp.out_biz_no,
                            pay_date: "",
                            sub_code: rsp.sub_code,
                            sub_msg: rsp.sub_msg,
                            transferAccountInfoUrl: url,
                            tenantId: tenantId
                        });
                    }
                    resolve(rsp);

                }
            });
        })

        return promise;

    }

    let instance = {
        transferAccounts: transferAccounts,
    }

    return instance;
})();

module.exports = transferAccountsManger;