const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
const util = require('../alipay/util');
let path = require('path');
let Tool = require('../../Tool/tool');
const fs = require('fs');
const Alipay = require('../alipay/index');
const Tables = db.models.Tables;
const TenantConfigs = db.models.TenantConfigs;
const PaymentReqs = db.models.PaymentReqs;
const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
const Coupons = db.models.Coupons;
const Consignees = db.models.Consignees;
const AlipayErrors = db.models.AlipayErrors;
const Vips = db.models.Vips;
const Foods = db.models.Foods;
const ProfitSharings = db.models.ProfitSharings;
const infoPushManager = require('../infoPush/infoPush');
const transAccountsManager = require('./transferAccounts')
const transAccounts = require('../customer/transAccount')
const customer = require('../admin/customer/customer')
const amountManager = require('../amount/amountManager')
const webSocket = require('../socketManager/socketManager');
const orderManager = require('../customer/order');
const config = require('../../config/config');
const getstatistics = require('../statistics/orderStatistic');

const aliDeal = new Alipay({
    appId: config.alipay.appId,
    notify_url: config.alipay.notify_url,//后台回调
    return_url: config.alipay.return_url,//前台回调
    rsaPrivate: path.resolve('./app/config/file/pem/sandbox_iobox_private.pem'),
    rsaPublic: path.resolve('./app/config/file/pem/sandbox_ali_public.pem'),
    sandbox: false,
    signType: 'RSA2'
});

const aliEshop = new Alipay({
    appId: config.alipay.appId,
    notify_url: config.alipay.notify_url,
    return_url: config.alipay.return_url,
    rsaPrivate: path.resolve('./app/config/file/pem/sandbox_iobox_private.pem'),
    rsaPublic: path.resolve('./app/config/file/pem/sandbox_ali_public.pem'),
    sandbox: false,
    signType: 'RSA2'
});

module.exports = {
    async getUserDealAlipayReq (ctx, next) {
        //ctx.checkQuery('amount').notEmpty().isFloat().toFloat();
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();
        ctx.checkQuery('tradeNo').notEmpty();

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

        let order = await Orders.findOne({
            where: {
                TableId: table.id,
                $or: [{status: 0}, {status: 1}],
                tenantId: ctx.query.tenantId,
                consigneeId: null
            }
        })

        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '订单不存在！请重新下单！')
            return;
        }

        //首单折扣，-1表示不折扣，根据手机号和租户id
        let firstDiscount = await orderManager.getFirstDiscount(order.phone, ctx.query.tenantId);

        //根据订单查询需要支付多少
        let total_amount = await orderManager.getOrderPriceByOrder(order, firstDiscount);

        //查找主商户名称
        let tenantConfigs = await TenantConfigs.findOne({
            where: {
                tenantId: ctx.query.tenantId
            }
        });
        //查找桌名
        let tableName = table.name;

        let merchant = tenantConfigs.name;

        let new_params = aliDeal.webPay({
            subject: merchant + '-' + tableName + '账单',
            body: '消费',
            outTradeId: ctx.query.tradeNo,
            timeout: '10m',
            amount: total_amount,
            goodsType: '1'
        });

        console.log(decodeURIComponent(new_params));

        let app_id_tmp = decodeURIComponent(new_params).split('&')[0];
        let app_id = app_id_tmp.substring(app_id_tmp.indexOf('=') + 1, app_id_tmp.length);

        let biz_content = decodeURIComponent(new_params).split('&')[1];
        let biz_json = JSON.parse(biz_content.substring(biz_content.indexOf('=') + 1, biz_content.length));

        let trade_no = biz_json.out_trade_no;
        total_amount = biz_json.total_amount;


        let order1 = await Orders.findOne({
            where: {
                trade_no: trade_no,
                TableId: table.id,
                status: 1,//待支付
                tenantId: ctx.query.tenantId,
                consigneeId: null
            }
        })

        //通过tableId，isFinish-false，isInvalid-false
        let paymentReqs = await PaymentReqs.findAll({
            where: {
                tableId: table.id,
                //paymentMethod: '支付宝',
                total_amount: total_amount,//订单变了价格会变，加上去限制
                isFinish: false,
                isInvalid: false,
                tenantId: ctx.query.tenantId,
                consigneeId: null,
                phoneNumber: null
            }
        });

        if (order1 != null && paymentReqs.length > 0) {
            paymentReqs[0].isInvalid = true;
            await paymentReqs[0].save();

            await PaymentReqs.create({
                params: new_params,
                tableId: table.id,
                paymentMethod: '支付宝',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                app_id: app_id,
                total_amount: total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                firstDiscount: firstDiscount,
                consigneeId: null,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: ctx.query.tenantId
            });

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)

        } else {
            await PaymentReqs.create({
                params: new_params,
                tableId: table.id,
                paymentMethod: '支付宝',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                app_id: app_id,
                total_amount: total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                consigneeId: null,
                firstDiscount: firstDiscount,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: ctx.query.tenantId
            });

            order.status = 1;//待支付
            await order.save();

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        }
    },

    async getUserEshopAlipayReq (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();
        ctx.checkQuery('tradeNo').notEmpty();
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

        let order = await Orders.findOne({
            where: {
                trade_no: ctx.query.tradeNo,
                $or: [{status: 0}, {status: 1}],
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
            }
        })

        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '订单不存在！请重新下单！')
            return;
        }

        //首单折扣，-1表示不折扣，根据手机号和租户id
        let firstDiscount = await orderManager.getFirstDiscount(order.phone, ctx.query.tenantId);

        //首杯半价
        let firstOrderDiscount = await orderManager.getFirstOrderDiscount(order);

        let firstOrder = false;
        if (firstOrderDiscount != 0) {
            firstOrder = true;
        }

        //根据订单查询需要支付多少
        let total_amount = await orderManager.getOrderPriceByOrder(order, firstDiscount, firstOrderDiscount);
        // console.log("total_amount========" + total_amount);


        //查找主商户名称
        let tenantConfigs = await TenantConfigs.findOne({
            where: {
                tenantId: ctx.query.tenantId
            }
        });
        //查找桌名
        let tableName = table.name;

        let merchant = tenantConfigs.name;

        let new_params = aliEshop.webPay({
            subject: merchant + '-' + tableName + '账单',
            body: '消费',
            outTradeId: ctx.query.tradeNo,
            timeout: '10m',
            amount: total_amount,
            goodsType: '1'
        });

        console.log(decodeURIComponent(new_params));

        let app_id_tmp = decodeURIComponent(new_params).split('&')[0];
        let app_id = app_id_tmp.substring(app_id_tmp.indexOf('=') + 1, app_id_tmp.length);

        let biz_content = decodeURIComponent(new_params).split('&')[1];
        let biz_json = JSON.parse(biz_content.substring(biz_content.indexOf('=') + 1, biz_content.length));

        let trade_no = biz_json.out_trade_no;
        total_amount = biz_json.total_amount;


        console.log("支付宝需要支付金额 ====" + total_amount);

        //判断是否再次生成params
        //tableId and order状态不等于1-待支付状态（order满足一个就行）
        //且未超时失效

        let order1 = await Orders.findOne({
            where: {
                TableId: table.id,
                status: 1,//待支付
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                phone: ctx.query.phoneNumber,
            }
        })

        //通过tableId，isFinish-false，isInvalid-false
        let paymentReqs = await PaymentReqs.findAll({
            where: {
                tableId: table.id,
                //paymentMethod: '支付宝',
                total_amount: total_amount,//订单变了价格会变，加上去限制
                isFinish: false,
                isInvalid: false,
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                phoneNumber: ctx.query.phoneNumber,
            }
        });

        if (order1 != null && paymentReqs.length > 0) {
            paymentReqs[0].isInvalid = true;
            await paymentReqs[0].save();

            await PaymentReqs.create({
                params: new_params,
                tableId: table.id,
                paymentMethod: '支付宝',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                app_id: app_id,
                total_amount: total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                firstDiscount: firstDiscount,
                firstOrder: firstOrder,
                consigneeId: ctx.query.consigneeId,
                phoneNumber: ctx.query.phoneNumber,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: ctx.query.tenantId
            });

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        } else {
            await PaymentReqs.create({
                params: new_params,
                tableId: table.id,
                paymentMethod: '支付宝',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                app_id: app_id,
                total_amount: total_amount,
                actual_amount: total_amount,
                refund_amount: '0',
                refund_reason: '',
                firstDiscount: firstDiscount,
                firstOrder: firstOrder,
                consigneeId: ctx.query.consigneeId,
                phoneNumber: ctx.query.phoneNumber,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: ctx.query.tenantId
            });

            order.status = 1;//待支付
            await order.save();
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        }
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
            AlipayErrors.create({
                errRsp: JSON.stringify(response),
                signFlag: signFlag,
            });
        } else {
            //优惠券使用状态修改
            let coupon = await Coupons.findOne({
                where: {
                    trade_no: ret.out_trade_no,
                    status: 0
                }
            })

            if (coupon != null) {
                coupon.status = 1;
                await coupon.save();
            }
            //计算剩余菜品的数量


            // 根据订单号查询当前订单
            console.log(ret.out_trade_no)
            let orders = await OrderGoods.findAll({
                where: {
                    trade_no: ret.out_trade_no
                }
            })
            //根据查询到的foodId在菜单中查询当前的菜
            let rest;
            let FoodNameArray = []
            for (let i = 0; i < orders.length; i++) {
                let food = await Foods.findById(orders[i].FoodId);
                food.sellCount = food.sellCount + orders[i].num;
                food.todaySales = food.todaySales + orders[i].num;
                await food.save();
                FoodNameArray.push(food.name)
            }

            if (coupon != null) {
                coupon.status = 1;
                await coupon.save();
            }

            let paymentReqs = await PaymentReqs.findAll({
                where: {
                    trade_no: ret.out_trade_no,
                    app_id: ret.app_id,
                    total_amount: parseFloat(ret.total_amount),
                    paymentMethod: '支付宝',
                    isFinish: false,
                    isInvalid: false
                }
            });
            console.log("trade_no=" + ret.out_trade_no);
            console.log("app_id=" + ret.app_id);
            console.log("total_amount=" + parseFloat(ret.total_amount));

            if (paymentReqs.length > 0) {
                //桌状态改成0，空桌
                tableId = paymentReqs[0].tableId;
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
                let order = await Orders.findOne({
                    where: {
                        TableId: tableId,
                        $or: [{status: 0}, {status: 1}],
                        tenantId: tenantId,
                        consigneeId: consigneeId,
                        trade_no: ret.out_trade_no,
                    }
                });

                order.status = 2;
                await order.save();

                //如果订单超时删除，恢复
                if (order.deletedAt != null) {
                    await Orders.update({
                        deletedAt: null
                    }, {
                        where: {
                            trade_no: ret.out_trade_no,
                            status: 2,
                            deletedAt: {
                                $ne: null
                            }
                        },
                        paranoid: false
                    });
                }

                //支付请求表 isFinish改成true
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

                //根据tenantId，consigneeId，订单号获取分成转账金额
                //input:tenantId,consigneeId,trade_no
                //output:object（总金额，租户金额，代售金额）

                let amountJson = await amountManager.getTransAccountAmount(tenantId, consigneeId, ret.out_trade_no, '支付宝', 0);

                console.log("amountJson = " + JSON.stringify(amountJson, null, 2));

                let customerVips = await Vips.findAll({
                    where:{
                        phone : order.phone,
                        tenantId : tenantId,
                    }
                });
                let isVip = false
                if(customerVips.length>0){
                    isVip =true
                }
                let customerJson = {
                    tenantId : tenantId,
                    phone : order.phone,
                    status : 3,
                    foodName : JSON.stringify(FoodNameArray),
                    totalPrice :amountJson.totalPrice,
                    isVip : isVip
                }
                await customer.savecustomer(customerJson);

                try {
                    amountJson.tenantId = tenantId;
                    amountJson.consigneeId = consigneeId;
                    amountJson.phone = order.phone;
                    amountJson.trade_no = ret.out_trade_no;
                    await getstatistics.setOrders(amountJson);
                } catch (e) {
                    console.log(e);
                }


                //支付完成推送支付成功消息
                let date = new Date().format("hh:mm");
                let content;
                if (consignee != null) {
                    content = '代售商:' + consignee.name + ' ' + table.name + ' 已结账 订单总价： ' + amountJson.totalPrice + '元 ' + date;
                } else {
                    content = table.name + ' 已结账 订单总价： ' + amountJson.totalPrice + '元 ' + date;
                }
                infoPushManager.infoPush(content, tenantId);

                let result;
                if (tenantConfig != null) {
                    if (tenantConfig.isRealTime) {
                        if (consignee == null) {
                            result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, amountJson.totalAmount, null, '收益', tenantId);
                            console.log('1111||' + result);
                            if (result.msg == 'Success') {
                                paymentReqs[0].TransferAccountIsFinish = true;
                                await paymentReqs[0].save();
                            } else {
                                if  (amountJson.totalAmount >0) {
                                    await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, amountJson.totalAmount, '收益', '支付宝', '租户', tenantId, consigneeId);
                                }
                            }
                        } else {
                            let profitsharing = await ProfitSharings.findOne({
                                where: {
                                    tenantId: tenantId,
                                    consigneeId: consigneeId
                                }
                            });

                            if (profitsharing == null) {
                                result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, amountJson.totalAmount, null, '收益', tenantId);
                                console.log('2222||' + result);
                                if (result.msg == 'Success') {
                                    paymentReqs[0].TransferAccountIsFinish = true;
                                    await paymentReqs[0].save();
                                } else {
                                    if  (amountJson.totalAmount >0) {
                                        await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, amountJson.totalAmount, '收益', '支付宝', '租户', tenantId, consigneeId);
                                    }
                                }
                            } else {
                                result = await transAccountsManager.transferAccounts(tenantConfig.payee_account, amountJson.merchantAmount, null, profitsharing.merchantRemark, tenantId);
                                console.log('3333||' + result);
                                if (result.msg == 'Success') {
                                    paymentReqs[0].TransferAccountIsFinish = true;
                                    await paymentReqs[0].save();
                                } else {
                                    if  (amountJson.merchantAmount >0) {
                                        await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, amountJson.merchantAmount, profitsharing.merchantRemark, '支付宝', '租户', tenantId, consigneeId);
                                    }
                                }

                                result = await transAccountsManager.transferAccounts(consignee.payee_account, amountJson.consigneeAmount, null, profitsharing.consigneeRemark, tenantId);
                                console.log('4444||' + result);
                                if (result.msg == 'Success') {
                                    paymentReqs[0].consigneeTransferAccountIsFinish = true;
                                    await paymentReqs[0].save();
                                } else {
                                    if  (amountJson.consigneeAmount >0) {
                                        await transAccounts.pendingTransferAccounts(ret.out_trade_no, consignee.payee_account, amountJson.consigneeAmount, profitsharing.consigneeRemark, '支付宝', '代售', tenantId, consigneeId);
                                    }
                                }
                            }
                        }
                    } else {
                        if (consignee == null) {
                            if  (amountJson.totalAmount >0) {
                                await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, amountJson.totalAmount, '收益', '支付宝', '租户', tenantId, consigneeId);
                            }
                        } else {
                            let profitsharing = await ProfitSharings.findOne({
                                where: {
                                    tenantId: tenantId,
                                    consigneeId: consigneeId
                                }
                            });

                            if (profitsharing == null) {
                                if  (amountJson.totalAmount >0) {
                                    await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, amountJson.totalAmount, '收益', '支付宝', '租户', tenantId, consigneeId);
                                }
                            } else {
                                if  (amountJson.merchantAmount >0) {
                                    await transAccounts.pendingTransferAccounts(ret.out_trade_no, tenantConfig.payee_account, amountJson.merchantAmount, profitsharing.merchantRemark, '支付宝', '租户', tenantId, consigneeId);
                                }
                                if  (amountJson.consigneeAmount >0) {
                                    await transAccounts.pendingTransferAccounts(ret.out_trade_no, consignee.payee_account, amountJson.consigneeAmount, profitsharing.consigneeRemark, '支付宝', '代售', tenantId, consigneeId);
                                }
                            }
                        }
                    }
                }

            } else {
                AlipayErrors.create({
                    errRsp: JSON.stringify(response),
                    signFlag: signFlag,
                });
            }
        }
        //必须返回success
        ctx.body = "success";

        //通知管理台修改桌态,代售待完善
        if (tableId != 0) {
            let json = {"tableId": tableId, "status": 0};
            webSocket.sendSocket(JSON.stringify(json));
        }
    },

    async dealAlipayRefund(ctx, next) {
        ctx.checkBody('tradeNo').notEmpty();
        ctx.checkBody('refundAmount').notEmpty();
        ctx.checkBody('refundReason').notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let outRequestId = Date.now().toString();//时间戳当唯一标识
        let body = ctx.request.body;

        let paymentReqs = await PaymentReqs.findAll({
            where: {
                trade_no: body.tradeNo,
                paymentMethod: '支付宝',
                TransferAccountIsFinish: false,//转账完成后不能退款
                tenantId: body.tenantId,
                consigneeId: null
            }
        });

        if (paymentReqs.length == 0) {
            ctx.body = {
                resCode: -1,
                resMsg: "该订单已结算，不能退款！"
            }
            return;
        }

        let result = await aliDeal.refund({
            outTradeId: body.tradeNo,
            refundAmount: body.refundAmount,
            refundReason: body.refundReason,
            outRequestId: outRequestId
        });

        let refundRsp = JSON.parse(result.body).alipay_trade_refund_response;

        if (refundRsp.msg == 'Success') {
            let actual_amount = parseFloat(paymentReqs[0].total_amount) - parseFloat(refundRsp.refund_fee);
            paymentReqs[0].actual_amount = actual_amount;
            paymentReqs[0].refund_amount = refundRsp.refund_fee;
            paymentReqs[0].refund_reason = body.refundReason;
            await paymentReqs[0].save();

            ctx.body = {
                resCode: 0,
                resMsg: refundRsp.msg,
                result: {
                    actual_amount: actual_amount,
                    refund_amount: parseFloat(refundRsp.refund_fee)
                }
            }
        } else {
            ctx.body = {
                resCode: -1,
                resMsg: refundRsp.sub_msg,
            }
        }

    },

    async eshopAlipayRefund(ctx, next) {
        ctx.checkBody('tradeNo').notEmpty();
        ctx.checkBody('refundAmount').notEmpty();
        ctx.checkBody('refundReason').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let outRequestId = Date.now().toString();//时间戳当唯一标识
        let body = ctx.request.body;

        let paymentReqs = await PaymentReqs.findAll({
            where: {
                trade_no: body.tradeNo,
                paymentMethod: '支付宝',
                TransferAccountIsFinish: false,//转账完成后不能退款
                tenantId: body.tenantId,
                consigneeId: body.consigneeId
            }
        });

        if (paymentReqs.length == 0) {
            ctx.body = {
                resCode: -1,
                resMsg: "该订单已结算，不能退款！"
            }
            return;
        }

        let result = await aliEshop.refund({
            outTradeId: body.tradeNo,
            refundAmount: body.refundAmount,
            refundReason: body.refundReason,
            outRequestId: outRequestId
        });

        let refundRsp = JSON.parse(result.body).alipay_trade_refund_response;

        if (refundRsp.msg == 'Success') {
            let actual_amount = parseFloat(paymentReqs[0].total_amount) - parseFloat(refundRsp.refund_fee);
            paymentReqs[0].actual_amount = actual_amount;
            paymentReqs[0].refund_amount = refundRsp.refund_fee;
            paymentReqs[0].refund_reason = body.refundReason;
            await paymentReqs[0].save();

            ctx.body = {
                resCode: 0,
                resMsg: refundRsp.msg,
                result: {
                    actual_amount: actual_amount,
                    refund_amount: parseFloat(refundRsp.refund_fee)
                }
            }
        } else {
            ctx.body = {
                resCode: -1,
                resMsg: refundRsp.sub_msg,
            }
        }

    }
}