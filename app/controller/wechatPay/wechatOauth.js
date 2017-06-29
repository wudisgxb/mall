const OAuth = require('co-wechat-oauth')
const co = require('co')
const WXPay = require('co-wechat-payment')
const fs = require('fs')

var db = require('../../db/mysql/index');
var Tables = db.models.Tables;
var FoodOrders = db.models.FoodOrders;
var PaymentReqs = db.models.PaymentReqs;
var AlipayErrors = db.models.AlipayErrors;
var AlipayConfigs = db.models.AlipayConfigs;
var Foods = db.models.Foods;
var User = db.models.User;
var Vips = db.models.Vips
var ChildAlipayConfigs = db.models.ChildAlipayConfigs;
var RelationshipOfAlipays = db.models.RelationshipOfAlipays;
var transAccountsManager = require('../../controller/alipay/transferAccounts');
var infoPushManager = require('../../controller/infoPush/infoPush');
var webSocket = require('../../controller/socketManager/socketManager');

const ip = require('ip').address();

const client = new OAuth('wx09b412b006792e2c', '0e32eb3b17baa77d2ea46abd990b7c4d')
const wxpay = new WXPay({
    appId: 'wx09b412b006792e2c',
    mchId: '1456240202',
    partnerKey: 'EXvIG4rOpC7AlcooAFkoMAgWIoYa1VbR', //微信商户平台API密钥
    pfx: fs.readFileSync('./controller/wechatPay/apiclient_cert.p12'), //微信商户平台证书
})

module.exports = {
    async redirect() {
        //const path = this.query.path
        const auth_callback_url = `http://deal.xiaovbao.cn/wechatpay`

        // const auth_callback_url = 'http://119.29.180.92/user'

        console.log(`auth_callback_url: ${auth_callback_url}`)

        const url = client.getAuthorizeURL(auth_callback_url, '123', 'snsapi_base')
        console.log(`redirect url: ${url}`)
        // 重定向请求到微信服务器
        //this.redirect(url);
        this.body = {
            url : url
        }
        console.log(`start: ${new Date()}`)
    },
    // async getUser(this, next) {
    //   console.log(`code: ${this.query.code}`)
    //   const token = await client.getAccessToken(this.query.code)

    //   console.log(JSON.stringify(token, null, 2))

    //   console.log(`openid: ${token.data.openid}`)
    //   const userInfo = await client.getUser(openid)
    //   console.log(`userInfo: ${userInfo}`)
    //   this.body = userInfo
    // },
    async getOpenId() {
        const token = await client.getAccessToken(this.query.code);

        this.body = {
            openId : token.data.openid
        }
    },

    async getWechatPayParams() {
        //start
        var trade_no = Date.now().toString();
        var tableId = this.query.tableId;
        //var total_amount = this.query.total_amount;
        var total_amount = 0;
        var foodOrders = await FoodOrders.findAll({
            where: {
                TableId: tableId,
                $or: [{status : 0}, {status : 1}] ,
            },
            attributes: {
                exclude: ['updatedAt']
            }
        })

        var totalPrice = 0;
        var totalVipPrice = 0;

        for(var i = 0; i < foodOrders.length; i ++) {
            var food = await Foods.findAll({
                where: {
                    id: foodOrders[i].FoodId,
                },
                attributes: ["id","name","price","vipPrice"],
            })

            totalPrice += food[0].price * foodOrders[i].num;//原价
            totalVipPrice += food[0].vipPrice * foodOrders[i].num;//会员价
        }

        if (foodOrders[0] != null) {
            //判断vip
            if (foodOrders[0].phone != null) {
                var vips = await Vips.findAll({
                    where:{
                        phone:foodOrders[0].phone,
                        tenantId:this.query.tenantId
                    }
                })
                if (vips.length > 0) {
                    total_amount = Math.round(totalVipPrice*100)/100
                }else {
                    total_amount = Math.round(totalPrice*100)/100;
                }
            } else {
                total_amount =  Math.round(totalPrice*100)/100;
            }
        }

        //代售商户,利润分成
        var consignee = this.query.consignee || "";
        console.log("tenantId:" + this.query.tenantId);

        //查找主商户名称
        var alipayConfigs = await AlipayConfigs.findAll({
            where:{
                tenantId:this.query.tenantId
            }
        });
        //查找桌名
        console.log("tableId ============" + tableId);
        var table = await Tables.findById(tableId);
        var tableName = table.name;

        var merchant = alipayConfigs[0].merchant;
        console.log("merchant:" + merchant);

        var outTradeId = Date.now().toString();

        console.log(`code: ${this.query.code}`)
        const token = await client.getAccessToken(this.query.code)
        const ip = this.request.headers['x-real-ip']

        console.log(`openid: ${token.data.openid}; ip: ${ip}`)

        //存openid
        await User.create({
            nickname: foodOrders[0].phone,
            headimgurl: '',
            sex: '男',
            openid: token.data.openid,
            subscribe_time: '',
            unionid: 'unionidss'
        });

        const fn = co.wrap(wxpay.getBrandWCPayRequestParams.bind(wxpay))

        console.log("total_amount ============" + total_amount);

        var new_params = await fn({
            openid: token.data.openid,
            body: '公众号支付测试',
            detail: '公众号支付测试',
            out_trade_no: trade_no,
            total_fee: parseFloat(total_amount)*100,//分
            trade_type: 'JSAPI',
            spbill_create_ip: ip,
            notify_url: 'http://deal.xiaovbao.cn/api/v2/wechatPayNotify'
        })

        console.log(new_params)

        var app_id = new_params.appId;

        //判断是否再次生成params
        //tableId and order状态不等于1-待支付状态（order满足一个就行）
        //且未超时失效,微信貌似没有超时的说法，预留着，10分钟

        var foodOrders = await FoodOrders.findAll({
            where: {
                TableId: tableId,
                status:1//待支付
            }
        })

        //通过tableId，isFinish-false，isInvalid-false
        var paymentReqs = await PaymentReqs.findAll({
            where: {
                tableId : tableId,
                paymentMethod:'微信',
                isFinish : false,
                isInvalid : false
            }
        });

        if(foodOrders.length >0 && paymentReqs.length >0) {
            //判断是否失效 10min,微信不判断超时
            //if((Date.now() - paymentReqs[0].createdAt.getTime()) > 100*60*1000) {
                paymentReqs[0].isInvalid = true;
                await paymentReqs[0].save();

                await PaymentReqs.create({
                    params:JSON.stringify(new_params),
                    tableId: tableId,
                    paymentMethod:'微信',
                    isFinish: false,
                    isInvalid : false,
                    trade_no:trade_no,
                    app_id:app_id,
                    total_amount:total_amount,
                    actual_amount: total_amount,
                    refund_amount: '0',
                    refund_reason: '',
                    consignee:consignee,
                    TransferAccountIsFinish:false,
                    consigneeTransferAccountIsFinish:false,
                    tenantId:this.query.tenantId
                });

                for (var i = 0 ; i < foodOrders.length;i++) {
                    foodOrders[i].trade_no = trade_no;
                    foodOrders[i].paymentMethod = '微信';
                    await foodOrders[i].save();
                }

                new_params.trade_no = trade_no;
                this.body = new_params;
            // } else {
            //     this.body = JSON.parse(paymentReqs[0].params);
            // }
        } else {
            await PaymentReqs.create({
                params: JSON.stringify(new_params),
                tableId: tableId,
                paymentMethod: '微信',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                app_id: app_id,
                total_amount: total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                consignee: consignee,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: this.query.tenantId
            });

            foodOrders = await FoodOrders.findAll({
                where: {
                    TableId: tableId,
                    // status:0//未支付
                    $or: [{status: 0}, {status: 1}],
                }
            })

            for (var i = 0; i < foodOrders.length; i++) {
                foodOrders[i].status = 1;//待支付
                foodOrders[i].trade_no = trade_no;
                foodOrders[i].paymentMethod = '微信';
                await foodOrders[i].save();
            }

            new_params.trade_no = trade_no;
            this.body = new_params;
        }

    },

    async wechatPayNotify() {

        console.log(JSON.stringify(this.xmlBody));
        var xmlBody = this.xmlBody;
       //  var xmlBody = {
       //      "xml": {
       //          "appid": [
       //              "wx09b412b006792e2c"
       //          ],
       //          "bank_type": [
       //              "CFT"
       //          ],
       //          "cash_fee": [
       //              "100"
       //          ],
       //          "fee_type": [
       //              "CNY"
       //          ],
       //          "is_subscribe": [
       //              "Y"
       //          ],
       //          "mch_id": [
       //              "1456240202"
       //          ],
       //          "nonce_str": [
       //              "F3dySuM5FphnFXuFTDwbt48Z3zR9s0Hv"
       //          ],
       //          "openid": [
       //              "oeGC00rSlKScZMw7g9Bz3xj5hrsc"
       //          ],
       //          "out_trade_no": [
       //              "201503310654762879"
       //          ],
       //          "result_code": [
       //              "SUCCESS"
       //          ],
       //          "return_code": [
       //              "SUCCESS"
       //          ],
       //          "sign": [
       //              "363FFBC4FA836C251B61B96C1E8E368A"
       //          ],
       //          "time_end": [
       //              "20170617180009"
       //          ],
       //          "total_fee": [
       //              "100"
       //          ],
       //          "trade_type": [
       //              "JSAPI"
       //          ],
       //          "transaction_id": [
       //              "4003942001201706176160844634"
       //          ]
       //      }
       //  };
        var xml = xmlBody.xml;
        var tableId = 0;
        var str = "";
        var arr = Object.keys(xml);
        arr.forEach(function (e) {
            console.log(e + "||" +xml[e]);
            if (e != 'sign')  {
                if(arr[arr.length-1] != e) {
                    str = str + e + '=' + xml[e] + '&';
                } else {
                    str = str + e + '=' + xml[e] + '&' + 'key=EXvIG4rOpC7AlcooAFkoMAgWIoYa1VbR';
                }
            }
        })

        var fn = co.wrap(wxpay.getSign.bind(wxpay));
        const sign = await fn(str,'MD5')

        if (sign != xml.sign) {
            AlipayErrors.create({
                errRsp:JSON.stringify(this.xmlBody),
                signFlag: false,
            });
        } else {
            console.log(JSON.stringify({
                trade_no : xml.out_trade_no,
                app_id : xml.appid,
                total_amount : xml.total_fee/100,
                paymentMethod:'微信',
                isFinish : false,
                isInvalid : false
            },null,2));
            var paymentReqs = await PaymentReqs.findAll({
                where: {
                    trade_no : xml.out_trade_no,
                    app_id : xml.appid,
                    total_amount : xml.total_fee/100,
                    paymentMethod:'微信',
                    isFinish : false,
                    isInvalid : false
                }
            });
            console.log("trade_no="+ xml.out_trade_no);
            console.log("app_id="+ xml.appid);
            console.log("total_amount="+ parseFloat(xml.total_fee));

            if(paymentReqs.length > 0) {
                //桌状态改成0，空桌
                tableId = paymentReqs[0].tableId;
                console.log("tableId:" + tableId);
                //获取租户id
                var tenantId= paymentReqs[0].tenantId;

                var table = await Tables.findById(tableId);
                table.status = 0;
                await table.save();

                //order状态改成2-已支付
                var foodOrders = await FoodOrders.findAll({
                    where: {
                        TableId : tableId,
                        $or: [{status : 0}, {status : 1}] ,
                    }
                });

                for (var i=0;i<foodOrders.length;i++) {
                    foodOrders[i].status = 2;
                    await foodOrders[i].save();
                }

                paymentReqs[0].isFinish = true;
                await paymentReqs[0].save();

                //支付完成推送支付成功消息
                var date = new Date().format("hh:mm");
                var content = table.name + '已结账，结账金额： ' + xml.total_fee / 100 + '元 ' + date;
                infoPushManager.infoPush(content,tenantId);

                //判断是否实时转账
                var alipayConfigs = await AlipayConfigs.findAll({
                    where:{
                        tenantId:tenantId
                    }
                });

                ////四舍五入 千分之0.994转账
               // var total_amount = Math.round(xml.total_fee*0.994);
                var total_amount = xml.total_fee;
                console.log("aaaaaaaaa0000a||" + total_amount);
                console.log("aaaaaaaaa0000b||" + JSON.stringify(total_amount));
                if (alipayConfigs.length >0 ) {
                    if (alipayConfigs[0].isRealTime) {
                        console.log("服务器公网IP：" + ip);

                        var relationshipOfAlipays =  await RelationshipOfAlipays.findAll({
                            where :{
                                AlipayConfigId : alipayConfigs[0].id
                            }
                        });

                        if (relationshipOfAlipays.length ==0) {
                            var  params = {
                                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                //openid: 'oeGC00pAyM4kmJzjmt-asY73fDsA',
                                // check_name: 'FORCE_CHECK',
                                // re_user_name: '管靖',
                                openid : alipayConfigs[0].wecharPayee_account,
                                check_name: 'NO_CHECK',
                                amount: total_amount,
                                desc: alipayConfigs[0].remark,
                                spbill_create_ip: ip
                            }

                            fn = co.wrap(wxpay.transfers.bind(wxpay))
                            try {
                                var result = await fn(params);
                                console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result,null,2));
                                if(result.result_code == 'SUCCESS') {
                                    paymentReqs[0].TransferAccountIsFinish = true;
                                    await paymentReqs[0].save();
                                }
                            } catch (e) {
                                console.log(e);
                            }
                        } else {
                            var childAlipayConfigs =  await ChildAlipayConfigs.findAll({
                                where :{
                                    merchant : paymentReqs[0].consignee,
                                    tenantId : tenantId
                                }
                            });
                            if (childAlipayConfigs.length == 0) {
                                var  params = {
                                    partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                    //openid: 'oeGC00pAyM4kmJzjmt-asY73fDsA',
                                    // check_name: 'FORCE_CHECK',
                                    // re_user_name: '管靖',
                                    openid : alipayConfigs[0].wecharPayee_account,
                                    check_name: 'NO_CHECK',
                                    amount: total_amount,
                                    desc: alipayConfigs[0].remark,
                                    spbill_create_ip: ip
                                }

                                fn = co.wrap(wxpay.transfers.bind(wxpay))
                                try {
                                    var result = await fn(params);
                                    console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT1result:" + JSON.stringify(result,null,2));
                                    if(result.result_code == 'SUCCESS') {
                                        paymentReqs[0].TransferAccountIsFinish = true;
                                        await paymentReqs[0].save();
                                    }
                                } catch (e) {
                                    console.log(e);
                                }
                            } else {
                                for (var j = 0;j<relationshipOfAlipays.length;j++) {
                                    if (childAlipayConfigs[0].id == relationshipOfAlipays[j].ChildAlipayConfigId) {
                                        //找到对应关系
                                        var amount = total_amount * (1-childAlipayConfigs[0].rate-childAlipayConfigs[0].ownRate); //主商户提成
                                        amount = Math.round(amount);
                                        console.log("主商户分润：" + amount);
                                        var  params = {
                                            partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                            //openid: 'oeGC00pAyM4kmJzjmt-asY73fDsA',
                                            // check_name: 'FORCE_CHECK',
                                            // re_user_name: '管靖',
                                            openid : alipayConfigs[0].wecharPayee_account,
                                            check_name: 'NO_CHECK',
                                            amount: amount,
                                            desc: alipayConfigs[0].remark,
                                            spbill_create_ip: ip
                                        }

                                        fn = co.wrap(wxpay.transfers.bind(wxpay))
                                        try {
                                            var result1 = await fn(params);
                                            console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT2result:" + JSON.stringify(result1,null,2));
                                            if(result1.result_code == 'SUCCESS') {
                                                paymentReqs[0].TransferAccountIsFinish = true;
                                                await paymentReqs[0].save();

                                                //主商户转账成功才能给代售商户转账
                                                var child_amount = total_amount * childAlipayConfigs[0].rate;//代售商户
                                                child_amount = Math.round(child_amount);
                                                console.log("代售点分润：" + child_amount);
                                                params = {
                                                    partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                                    //openid: 'oeGC00pAyM4kmJzjmt-asY73fDsA',
                                                    // check_name: 'FORCE_CHECK',
                                                    // re_user_name: '管靖',
                                                    openid : childAlipayConfigs[0].wecharPayee_account,
                                                    check_name: 'NO_CHECK',
                                                    amount: child_amount,
                                                    desc: childAlipayConfigs[0].remark,
                                                    spbill_create_ip: ip
                                                }

                                                fn = co.wrap(wxpay.transfers.bind(wxpay))
                                                var result2 = await fn(params);
                                                console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3result:" + JSON.stringify(result2,null,2));
                                                if(result2.result_code == 'SUCCESS') {
                                                    paymentReqs[0].consigneeTransferAccountIsFinish = true;
                                                    await paymentReqs[0].save();
                                                }
                                            }
                                        } catch (e) {
                                            console.log(e);
                                        }


                                    }
                                }
                            }
                        }
                    }
                }

                //满300加会员
                foodOrders = await FoodOrders.findAll({
                    where: {
                        trade_no : xml.out_trade_no,
                    }
                });
                var phone = foodOrders[0].phone;
                var tenantId = foodOrders[0].tenantId;
                if (xml.total_fee >= 30000) {
                    var vips = await Vips.findAll({
                        where:{
                            phone: phone,
                            tenantId:tenantId
                        }
                    })
                    if (vips.length == 0) {
                        await Vips.create({
                            phone: phone,
                            vipLevel: 0,
                            vipName:"匿名",
                            tenantId:tenantId
                            // todo: ok?
                        });
                    }
                }
            } else {
                AlipayErrors.create({
                    errRsp:JSON.stringify(this.xmlBody),
                    signFlag: true,
                });
            }
        }

        this.body = "SUCCESS";

        //通知管理台修改桌态
        if (tableId != 0) {
            var json = {"tableId":tableId,"status":0};
            webSocket.sendSocket(JSON.stringify(json));
        }
    },

    async transfers() {
        //const ip = this.request.headers['x-real-ip']

        var ip = Ip.address();
        console.log("服务器公网IP：" + ip);
        const params = {
            partner_trade_no: Date.now(), //商户订单号，需保持唯一性
            //openid: 'oeGC00pAyM4kmJzjmt-asY73fDsA',
            // check_name: 'FORCE_CHECK',
            // re_user_name: '管靖',
            openid : 'oeGC00rSlKScZMw7g9Bz3xj5hrsc',
            check_name: 'NOT_CHECK',
            amount: 100,
            desc: '红包',
            spbill_create_ip: ip
        }

        const fn = co.wrap(wxpay.transfers.bind(wxpay))

        const result = await fn(params)

        console.log(result)
        this.body = result
    },

    async refund() {
        this.checkBody('outTradeId').notEmpty();
        this.checkBody('refundAmount').notEmpty();
        this.checkBody('refundReason').notEmpty();

        var outRequestId = Date.now().toString();//时间戳当唯一标识
        var body = this.request.body;

        var paymentReqs = await PaymentReqs.findAll({
            where: {
                trade_no : body.outTradeId,
                paymentMethod : '微信',
                TransferAccountIsFinish:false//转账完成后不能退款
            }
        });

        if (paymentReqs.length == 0) {
            this.body ={
                resCode:-1,
                resMsg:"该订单已结算，不能退款！"
            }
            return;
        }


        var params = {
            out_refund_no: Date.now(),
            total_fee: paymentReqs[0].total_amount*100, //原支付金额
            refund_fee: body.refundAmount*100, //退款金额
            //transaction_id: '4006422001201706155802694657',
            refund_desc:body.refundReason,
            //out_trade_no:'1498125730292'
            out_trade_no:body.outTradeId
        }

        const fn = co.wrap(wxpay.refund.bind(wxpay))

        try {
            const result = await fn(params);
            console.log("KKKKKKKKKKKKKKKKKKKKKKKK-退款结果：" + JSON.stringify(result,null,2));

            if (result.result_code == 'SUCCESS') {
                paymentReqs[0].refund_amount = paymentReqs[0].refund_amount + result.refund_fee /100;
                paymentReqs[0].actual_amount = paymentReqs[0].total_amount - paymentReqs[0].refund_amount;
                paymentReqs[0].refund_reason = body.refundReason;
                await paymentReqs[0].save();

                this.body = {
                    resCode:0,
                    //resMsg:result.err_code_des,
                    resMsg:'SUCCESS'
                };
            } else {
                this.body = {
                    resCode:-1,
                    //resMsg:result.err_code_des,
                    resMsg:result.err_code_des
                };
            }

        } catch (e) {
            console.log(e);
            this.body = {
                resCode:-2,
                resMsg:e
            }
        }
    },

    async queryTransferInfo() {
        var params = {
            partner_trade_no:'1497504255624'
        }

        const fn = co.wrap(wxpay.queryTransferInfo.bind(wxpay))

        const result = await fn(params)
        this.body = result
    }
}