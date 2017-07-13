const OAuth = require('co-wechat-oauth')
const co = require('co')
const WXPay = require('co-wechat-payment')
const fs = require('fs')
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')

const db = require('../../db/mysql/index');
const Tables = db.models.Tables;
const Orders = db.models.Orders;
const PaymentReqs = db.models.PaymentReqs;
const AlipayErrors = db.models.AlipayErrors;
const TenantConfigs = db.models.TenantConfigs;
const Foods = db.models.Foods;
const Coupons = db.models.Coupons;
const User = db.models.User;
const Vips = db.models.Vips
const Consignees = db.models.Consignees;
const ProfitSharings = db.models.ProfitSharings;
const infoPushManager = require('../../controller/infoPush/infoPush');
const webSocket = require('../../controller/socketManager/socketManager');

const orderManager = require('../customer/order');
const config = require('../../config/config')

const ip = require('ip').address();

const client = new OAuth(config.wechat.appId, config.wechat.secret)
const wxpay = new WXPay({
    appId: config.wechat.appId,
    mchId: config.wechat.mchId,
    partnerKey: config.wechat.partnerKey, //微信商户平台API密钥
    pfx: fs.readFileSync('./app/controller/wechatPay/apiclient_cert.p12'), //微信商户平台证书
})

module.exports = {
    async userDealRedirect(ctx,next) {
        //const path = ctx.query.path
        const auth_callback_url = `http://deal.xiaovbao.cn/wechatpay`

        // const auth_callback_url = 'http://119.29.180.92/user'

        console.log(`auth_callback_url: ${auth_callback_url}`)

        const url = client.getAuthorizeURL(auth_callback_url, 'deal', 'snsapi_base')
        console.log(`redirect url: ${url}`)
        // 重定向请求到微信服务器
        //ctx.redirect(url);

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, url)
        console.log(`start: ${new Date()}`)
    },

    async userEshopRedirect(ctx,next) {
        //const path = ctx.query.path
        const auth_callback_url = `http://deal.xiaovbao.cn/wechatpay`

        // const auth_callback_url = 'http://119.29.180.92/user'

        console.log(`auth_callback_url: ${auth_callback_url}`)

        const url = client.getAuthorizeURL(auth_callback_url, 'eshop', 'snsapi_base')
        console.log(`redirect url: ${url}`)
        // 重定向请求到微信服务器
        //ctx.redirect(url);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, url)
        console.log(`start: ${new Date()}`)
    },


    // async getUser(ctx, next) {
    //   console.log(`code: ${ctx.query.code}`)
    //   const token = await client.getAccessToken(ctx.query.code)

    //   console.log(JSON.stringify(token, null, 2))

    //   console.log(`openid: ${token.data.openid}`)
    //   const userInfo = await client.getUser(openid)
    //   console.log(`userInfo: ${userInfo}`)
    //   ctx.body = userInfo
    // },
    async getOpenId(ctx,next) {
        const token = await client.getAccessToken(ctx.query.code);

        ctx.body = {
            openId : token.data.openid
        }
    },

    async getUserDealWechatPayParams(ctx,next) {
        //start
        ctx.checkQuery('code').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();
        //ctx.checkQuery('tradeNo').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        //获取tableId
        const table = await Tables.findOne({
            where: {
                tenantId: ctx.query.tenantId,
                name: ctx.query.tableName,
                consigneeId: null
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let total_amount = 0;
        let orders = await Orders.findAll({
            where: {
                //trade_no:trade_no,
                TableId: table.id,
                $or: [{status : 0}, {status : 1}] ,
                tenantId: ctx.query.tenantId,
                consigneeId: null
            }
        })

        if (orders.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '订单不存在！请重新下单！')
            return;
        }

        let trade_no = orders[0].trade_no;

        let totalPrice = 0;
        let totalVipPrice = 0;

        let food;
        for(var i = 0; i < orders.length; i ++) {
            food = await Foods.findAll({
                where: {
                    id: orders[i].FoodId,
                    tenantId: ctx.query.tenantId
                }
            })

            totalPrice += food[0].price * orders[i].num;//原价
            totalVipPrice += food[0].vipPrice * orders[i].num;//会员价
        }

        if (orders[0] != null) {
            //判断vip
            if (orders[0].phone != null) {
                var vips = await Vips.findAll({
                    where:{
                        phone:orders[0].phone,
                        tenantId:ctx.query.tenantId
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


        //查找主商户名称
        let tenantConfigs = await TenantConfigs.findOne({
            where: {
                tenantId: ctx.query.tenantId
            }
        });

        //查找桌名
        let tableName = table.name;
        console.log("tableName:" + tableName);
        let merchant = tenantConfigs.name;
        console.log("merchant:" + merchant);

        console.log(`code: ${ctx.query.code}`)
        const token = await client.getAccessToken(ctx.query.code)
        const ip = ctx.request.headers['x-real-ip']

        console.log(`openid: ${token.data.openid}; ip: ${ip}`)

        //存openid
        await User.create({
            nickname: orders[0].phone,
            headimgurl: '',
            sex: 1,
            openid: token.data.openid,
            subscribe_time: new Date(),
            unionid: 'unionidss'
        });

        const fn = co.wrap(wxpay.getBrandWCPayRequestParams.bind(wxpay))

        console.log("total_amount ============" + total_amount);

        let new_params = await fn({
            openid: token.data.openid,
            body: merchant + '-' + tableName + '账单',
          //  detail: '公众号支付测试',
            out_trade_no: trade_no,
            total_fee: parseFloat(total_amount)*100,//分
            trade_type: 'JSAPI',
            spbill_create_ip: ip,
            notify_url: 'http://deal.xiaovbao.cn/api/v3/wechatPayNotify'
        })
        new_params.trade_no = trade_no;

        console.log(new_params)

        let app_id = new_params.appId;

        //判断是否再次生成params
        //tableId and order状态不等于1-待支付状态（order满足一个就行）
        //且未超时失效,微信貌似没有超时的说法，预留着，10分钟

        orders = await Orders.findAll({
            where: {
                trade_no:trade_no,
                TableId: table.id,
                status:1,//待支付
                tenantId: ctx.query.tenantId,
                consigneeId: null
            }
        })

        //通过tableId，isFinish-false，isInvalid-false
        let paymentReqs = await PaymentReqs.findAll({
            where: {
                tableId : table.id,
                paymentMethod:'微信',
                isFinish : false,
                isInvalid : false,
                tenantId: ctx.query.tenantId,
                consigneeId: null
            }
        });

        if(orders.length >0 && paymentReqs.length >0) {
            //判断是否失效 10min,微信不判断超时
            //if((Date.now() - paymentReqs[0].createdAt.getTime()) > 100*60*1000) {
            paymentReqs[0].isInvalid = true;
            await paymentReqs[0].save();

            await PaymentReqs.create({
                params:JSON.stringify(new_params),
                tableId: table.id,
                paymentMethod:'微信',
                isFinish: false,
                isInvalid : false,
                trade_no:trade_no,
                app_id:app_id,
                total_amount:total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                consigneeId: null,
                TransferAccountIsFinish:false,
                consigneeTransferAccountIsFinish:false,
                tenantId:ctx.query.tenantId
            });

            for (var i = 0 ; i < orders.length;i++) {
                //orders[i].trade_no = trade_no;
                orders[i].paymentMethod = '微信';
                await orders[i].save();
            }
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        } else {
            await PaymentReqs.create({
                params: JSON.stringify(new_params),
                tableId: table.id,
                paymentMethod: '微信',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                app_id: app_id,
                total_amount: total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                consigneeId: null,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: ctx.query.tenantId
            });

            orders = await Orders.findAll({
                where: {
                    TableId: table.id,
                    // status:0//未支付
                    $or: [{status: 0}, {status: 1}],
                    tenantId: ctx.query.tenantId,
                    consigneeId:null
                }
            })

            for (var i = 0; i < orders.length; i++) {
                orders[i].status = 1;//待支付
               // orders[i].trade_no = trade_no;
                orders[i].paymentMethod = '微信';
                await orders[i].save();
            }

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        }

    },

    async getUserEshopWechatPayParams(ctx,next) {
        //start
        ctx.checkQuery('code').notEmpty();
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();
       // ctx.checkQuery('tradeNo').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        ctx.checkQuery('phoneNumber').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }


        //获取tableId
        const table = await Tables.findOne({
            where: {
                tenantId: ctx.query.tenantId,
                name: ctx.query.tableName,
                consigneeId: ctx.query.consigneeId
            }
        })

        if (table == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '未找到桌号！')
            return;
        }

        let total_amount = 0;
        let orders = await Orders.findAll({
            where: {
                //trade_no:trade_no,
                TableId: table.id,
                $or: [{status : 0}, {status : 1}] ,
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                phone:ctx.query.phoneNumber
            }
        })

        if (orders.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '订单不存在！请重新下单！')
            return;
        }

        let trade_no = orders[0].trade_no;

        let totalPrice = 0;
        let totalVipPrice = 0;

        let food;
        for(var i = 0; i < orders.length; i ++) {
            food = await Foods.findAll({
                where: {
                    id: orders[i].FoodId,
                    tenantId: ctx.query.tenantId
                }
            })

            totalPrice += food[0].price * orders[i].num;//原价
            totalVipPrice += food[0].vipPrice * orders[i].num;//会员价
        }

        if (orders[0] != null) {
            //判断vip
            if (orders[0].phone != null) {
                var vips = await Vips.findAll({
                    where:{
                        phone:orders[0].phone,
                        tenantId:ctx.query.tenantId
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


        //查找主商户名称
        let tenantConfigs = await TenantConfigs.findOne({
            where: {
                tenantId: ctx.query.tenantId
            }
        });

        //查找桌名
        let tableName = table.name;
        console.log("tableName:" + tableName);
        let merchant = tenantConfigs.name;
        console.log("merchant:" + merchant);

        console.log(`code: ${ctx.query.code}`)
        const token = await client.getAccessToken(ctx.query.code)
        const ip = ctx.request.headers['x-real-ip']

        console.log(`openid: ${token.data.openid}; ip: ${ip}`)

        //存openid
        await User.create({
            nickname: orders[0].phone,
            headimgurl: '',
            sex: 1,
            openid: token.data.openid,
            subscribe_time: new Date(),
            unionid: 'unionidss'
        });

        const fn = co.wrap(wxpay.getBrandWCPayRequestParams.bind(wxpay))

        console.log("total_amount ============" + total_amount);

        let new_params = await fn({
            openid: token.data.openid,
            body: merchant + '-' + tableName + '账单',
            //  detail: '公众号支付测试',
            out_trade_no: trade_no,
            total_fee: parseFloat(total_amount)*100,//分
            trade_type: 'JSAPI',
            spbill_create_ip: ip,
            notify_url: 'http://deal.xiaovbao.cn/api/v3/wechatPayNotify'
        })
        new_params.trade_no = trade_no;

        console.log(new_params)

        let app_id = new_params.appId;

        //判断是否再次生成params
        //tableId and order状态不等于1-待支付状态（order满足一个就行）
        //且未超时失效,微信貌似没有超时的说法，预留着，10分钟

        orders = await Orders.findAll({
            where: {
                trade_no:trade_no,
                TableId: table.id,
                status:1,//待支付
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                phone:ctx.query.phoneNumber
            }
        })

        //通过tableId，isFinish-false，isInvalid-false
        let paymentReqs = await PaymentReqs.findAll({
            where: {
                tableId : table.id,
                paymentMethod:'微信',
                isFinish : false,
                isInvalid : false,
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                phoneNumber:ctx.query.phoneNumber
            }
        });

        if(orders.length >0 && paymentReqs.length >0) {
            //判断是否失效 10min,微信不判断超时
            //if((Date.now() - paymentReqs[0].createdAt.getTime()) > 100*60*1000) {
            paymentReqs[0].isInvalid = true;
            await paymentReqs[0].save();

            await PaymentReqs.create({
                params:JSON.stringify(new_params),
                tableId: table.id,
                paymentMethod:'微信',
                isFinish: false,
                isInvalid : false,
                trade_no:trade_no,
                app_id:app_id,
                total_amount:total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                consigneeId: ctx.query.consigneeId,
                phoneNumber:ctx.query.phoneNumber,
                TransferAccountIsFinish:false,
                consigneeTransferAccountIsFinish:false,
                tenantId:ctx.query.tenantId
            });

            for (var i = 0 ; i < orders.length;i++) {
                //orders[i].trade_no = trade_no;
                orders[i].paymentMethod = '微信';
                await orders[i].save();
            }
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        } else {
            await PaymentReqs.create({
                params: JSON.stringify(new_params),
                tableId: table.id,
                paymentMethod: '微信',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                app_id: app_id,
                total_amount: total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                consigneeId: ctx.query.consigneeId,
                phoneNumber:ctx.query.phoneNumber,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: ctx.query.tenantId
            });

            orders = await Orders.findAll({
                where: {
                    TableId: table.id,
                    // status:0//未支付
                    $or: [{status: 0}, {status: 1}],
                    tenantId: ctx.query.tenantId,
                    consigneeId: ctx.query.consigneeId,
                    phone:ctx.query.phoneNumber
                }
            })

            for (var i = 0; i < orders.length; i++) {
                orders[i].status = 1;//待支付
                // orders[i].trade_no = trade_no;
                orders[i].paymentMethod = '微信';
                await orders[i].save();
            }

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        }

    },

    async wechatPayNotify(ctx,next) {

        console.log(JSON.stringify(ctx.xmlBody));
        let xmlBody = ctx.xmlBody;
        // var xmlBody = {
        //     "xml": {
        //         "appid": [
        //             "wx09b412b006792e2c"
        //         ],
        //         "bank_type": [
        //             "CFT"
        //         ],
        //         "cash_fee": [
        //             "100"
        //         ],
        //         "fee_type": [
        //             "CNY"
        //         ],
        //         "is_subscribe": [
        //             "Y"
        //         ],
        //         "mch_id": [
        //             "1456240202"
        //         ],
        //         "nonce_str": [
        //             "F3dySuM5FphnFXuFTDwbt48Z3zR9s0Hv"
        //         ],
        //         "openid": [
        //             "oeGC00rSlKScZMw7g9Bz3xj5hrsc"
        //         ],
        //         "out_trade_no": [
        //             "201503310654762879"
        //         ],
        //         "result_code": [
        //             "SUCCESS"
        //         ],
        //         "return_code": [
        //             "SUCCESS"
        //         ],
        //         "sign": [
        //             "363FFBC4FA836C251B61B96C1E8E368A"
        //         ],
        //         "time_end": [
        //             "20170617180009"
        //         ],
        //         "total_fee": [
        //             "100"
        //         ],
        //         "trade_type": [
        //             "JSAPI"
        //         ],
        //         "transaction_id": [
        //             "4003942001201706176160844634"
        //         ]
        //     }
        // };
        let xml = xmlBody.xml;
        let tableId = 0;
        let str = "";
        let arr = Object.keys(xml);
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

        let fn = co.wrap(wxpay.getSign.bind(wxpay));
        const sign = await fn(str,'MD5')

        if (sign !== xml.sign[0]) {
            AlipayErrors.create({
                errRsp:JSON.stringify(ctx.xmlBody),
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

            //优惠券使用状态修改
            let coupon = await Coupons.findOne({
                where: {
                    trade_no:  xml.out_trade_no,
                    status: 0
                }
            })

            if (coupon != null) {
                coupon.status = 1;
                await coupon.save();
            }


            let order = await Orders.findAll({
                where:{
                    trade_no:xml.out_trade_no
                }
            })
            //根据查询到的foodId在菜单中查询当前的菜
            for(let i = 0;i<order.length;i++){
                let food = await Foods.findById(order[i].FoodId);
                //将查询到的数量减去查询到的数量
                food.sellCount=food.sellCount+order[i].num;
                food.todaySales=food.todaySales+order[i].num;
                await food.save();
            }


            let paymentReqs = await PaymentReqs.findAll({
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
                //获取租户id,代售点id
                let tenantId = paymentReqs[0].tenantId;
                let consigneeId = paymentReqs[0].consigneeId;

                let table = await Tables.findOne({
                    where: {
                        id: tableId,
                        consigneeId: consigneeId //修改点餐桌状态
                    }
                });
                if (table != null) {
                    table.status = 0;
                    await table.save();
                }

                //order状态改成2-已支付
                let orders = await Orders.findAll({
                    where: {
                        TableId : tableId,
                        paymentMethod: '微信',
                        $or: [{status: 0}, {status: 1}],
                        tenantId:tenantId,
                        consigneeId: consigneeId,
                        trade_no: xml.out_trade_no,
                    }
                });

                for (var i=0;i<orders.length;i++) {
                    orders[i].status = 2;
                    await orders[i].save();
                }

                paymentReqs[0].isFinish = true;
                await paymentReqs[0].save();

                //查找主商户信息
                let tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: tenantId
                    }
                });

                //查找代售商户信息
                let consignee = await Consignees.findOne({
                    where: {
                        consigneeId: consigneeId
                    }
                });

                //支付完成推送支付成功消息
                let date = new Date().format("hh:mm");
                let content;
                if (consignee != null) {
                    content = '代售商:' + consignee.name + ' ' + table.name + '已结账，结账金额： ' + xml.total_fee / 100 + '元 ' + date;
                } else {
                    content = table.name + '已结账，结账金额： ' + xml.total_fee / 100 + '元 ' + date;
                }
                infoPushManager.infoPush(content, tenantId);

                ////四舍五入 千分之0.994转账
               // var total_amount = Math.round(xml.total_fee*0.994);
                var total_amount = xml.total_fee;
                console.log("aaaaaaaaa0000a||" + total_amount);
                console.log("aaaaaaaaa0000b||" + JSON.stringify(total_amount));
                if (tenantConfig != null ) {
                    if (tenantConfig.isRealTime) {
                        console.log("服务器公网IP：" + ip);
                        let  params;
                        let result;
                        fn = co.wrap(wxpay.transfers.bind(wxpay))
                        if (consignee == null) {
                            params = {
                                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                openid : tenantConfig.wecharPayee_account,
                                check_name: 'NO_CHECK',
                                amount: total_amount,
                                //desc: tenantConfig.remark,
                                desc: '收益',
                                spbill_create_ip: ip
                            }

                            try {
                                result = await fn(params);
                                console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result,null,2));
                                if(result.result_code == 'SUCCESS') {
                                    paymentReqs[0].TransferAccountIsFinish = true;
                                    await paymentReqs[0].save();
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
                                params = {
                                    partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                    openid : tenantConfig.wecharPayee_account,
                                    check_name: 'NO_CHECK',
                                    amount: total_amount,
                                    //desc: tenantConfig.remark,
                                    desc: '收益',
                                    spbill_create_ip: ip
                                }

                                try {
                                    result = await fn(params);
                                    console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT1result:" + JSON.stringify(result,null,2));
                                    if(result.result_code == 'SUCCESS') {
                                        paymentReqs[0].TransferAccountIsFinish = true;
                                        await paymentReqs[0].save();
                                    }
                                } catch (e) {
                                    console.log(e);
                                }
                            } else {
                                //找到对应关系
                                let amount = total_amount * (1-profitsharing.rate-profitsharing.ownRate); //主商户提成
                                amount = Math.round(amount);
                                console.log("主商户分润：" + amount);
                                params = {
                                    partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                    openid : tenantConfig.wecharPayee_account,
                                    check_name: 'NO_CHECK',
                                    amount: amount,
                                    desc: profitsharing.merchantRemark,
                                    spbill_create_ip: ip
                                }

                                try {
                                    result = await fn(params);
                                    console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT2result:" + JSON.stringify(result,null,2));
                                    if(result.result_code == 'SUCCESS') {
                                        paymentReqs[0].TransferAccountIsFinish = true;
                                        await paymentReqs[0].save();

                                        //主商户转账成功才能给代售商户转账
                                        let consignee_amount = total_amount * profitsharing.rate;//代售商户
                                        consignee_amount = Math.round(consignee_amount);
                                        console.log("代售点分润：" + consignee_amount);
                                        params = {
                                            partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                            openid : consignee.wecharPayee_account,
                                            check_name: 'NO_CHECK',
                                            amount: consignee_amount,
                                            desc: profitsharing.consigneeRemark,
                                            spbill_create_ip: ip
                                        }

                                        result = await fn(params);
                                        console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3result:" + JSON.stringify(result,null,2));
                                        if(result.result_code == 'SUCCESS') {
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

                // //满多少加会员,考虑订单会删除，要加paranoid: false查询delete的
                // orders = await Orders.findAll({
                //     where: {
                //         trade_no: xml.out_trade_no,
                //     },
                //     paranoid: false
                // });
                // let phone = orders[0].phone;
                //
                // let vip = await Vips.findOne({
                //     where: {
                //         phone: phone,
                //         tenantId: orders[0].tenantId
                //     }
                // })
                //
                // if (vip == null) {
                //     //根据订单算原始总价格
                //     let orderPrice = await orderManager.getOrderPriceByTradeNo(xml.out_trade_no, tenantId);
                //     console.log("orderPrice:" + orderPrice);
                //     console.log("xml.total_fee" + xml.total_fee/100 + '元');
                //     if (orderPrice >= tenantConfig.vipFee) {
                //         await Vips.create({
                //             phone: phone,
                //             vipLevel: 0,
                //             vipName: "匿名",
                //             tenantId: orders[0].tenantId
                //             // todo: ok?
                //         });
                //     }
                // }
            } else {
                AlipayErrors.create({
                    errRsp:JSON.stringify(ctx.xmlBody),
                    signFlag: true,
                });
            }
        }

        ctx.body = "SUCCESS";

        //通知管理台修改桌态
        if (tableId != 0) {
            var json = {"tableId":tableId,"status":0};
            webSocket.sendSocket(JSON.stringify(json));
        }
    },

    async transfers(ctx,next) {
        //const ip = ctx.request.headers['x-real-ip']

        var ip = Ip.address();
        console.log("服务器公网IP：" + ip);
        const params = {
            partner_trade_no: Date.now(), //商户订单号，需保持唯一性
            openid : 'oeGC00rSlKScZMw7g9Bz3xj5hrsc',
            check_name: 'NOT_CHECK',
            amount: 100,
            desc: '红包',
            spbill_create_ip: ip
        }

        const fn = co.wrap(wxpay.transfers.bind(wxpay))

        const result = await fn(params)

        console.log(result)
        ctx.body = result
    },

    async dealWechatRefund(ctx,next) {
        ctx.checkBody('tradeNo').notEmpty();
        ctx.checkBody('refundAmount').notEmpty();
        ctx.checkBody('refundReason').notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        var body = ctx.request.body;

        var paymentReqs = await PaymentReqs.findAll({
            where: {
                trade_no : body.tradeNo,
                paymentMethod : '微信',
                TransferAccountIsFinish:false,//转账完成后不能退款
                tenantId: body.tenantId,
                consigneeId:null
            }
        });

        if (paymentReqs.length == 0) {
            ctx.body ={
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
            out_trade_no:body.tradeNo
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

                ctx.body = {
                    resCode:0,
                    //resMsg:result.err_code_des,
                    resMsg:'SUCCESS'
                };
            } else {
                ctx.body = {
                    resCode:-1,
                    //resMsg:result.err_code_des,
                    resMsg:result.err_code_des
                };
            }

        } catch (e) {
            console.log(e);
            ctx.body = {
                resCode:-2,
                resMsg:e
            }
        }
    },

    async eshopWechatRefund(ctx,next) {
        ctx.checkBody('tradeNo').notEmpty();
        ctx.checkBody('refundAmount').notEmpty();
        ctx.checkBody('refundReason').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();

        var body = ctx.request.body;

        var paymentReqs = await PaymentReqs.findAll({
            where: {
                trade_no : body.tradeNo,
                paymentMethod : '微信',
                TransferAccountIsFinish:false,//转账完成后不能退款
                tenantId: body.tenantId,
                consigneeId:body.consigneeId
            }
        });

        if (paymentReqs.length == 0) {
            ctx.body ={
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
            out_trade_no:body.tradeNo
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

                ctx.body = {
                    resCode:0,
                    //resMsg:result.err_code_des,
                    resMsg:'SUCCESS'
                };
            } else {
                ctx.body = {
                    resCode:-1,
                    //resMsg:result.err_code_des,
                    resMsg:result.err_code_des
                };
            }

        } catch (e) {
            console.log(e);
            ctx.body = {
                resCode:-2,
                resMsg:e
            }
        }
    },

    async queryTransferInfo(ctx,next) {
        var params = {
            partner_trade_no:'1497504255624'
        }

        const fn = co.wrap(wxpay.queryTransferInfo.bind(wxpay))

        const result = await fn(params)
        ctx.body = result
    }
}