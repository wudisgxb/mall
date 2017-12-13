const OAuth = require('co-wechat-oauth')
const co = require('co')
const WXPay = require('co-wechat-payment')
const fs = require('fs')
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const customer = require('../admin/customer/customer')
const db = require('../../db/mysql/index');
const Tables = db.models.Tables;
const Orders = db.models.NewOrders;
const OrderGoods = db.models.OrderGoods;
const PaymentReqs = db.models.PaymentReqs;
const AlipayErrors = db.models.AlipayErrors;
const TenantConfigs = db.models.TenantConfigs;
const AllianceMerchants = db.models.AllianceMerchants;
const MerchantSetIntegrals = db.models.MerchantSetIntegrals;
const VipIntegrals = db.models.VipIntegrals;
const Foods = db.models.Foods;
const Coupons = db.models.Coupons;
const User = db.models.User;
const Vips = db.models.Vips
const TransferAccounts = db.models.TransferAccounts
const Merchants = db.models.Merchants
const Consignees = db.models.Consignees;
const ProfitSharings = db.models.ProfitSharings;
const infoPushManager = require('../../controller/infoPush/infoPush');
const webSocket = require('../../controller/socketManager/socketManager');
const amountManager = require('../amount/amountManager')
const transAccounts = require('../customer/transAccount')
const orderManager = require('../customer/order');
const config = require('../../config/config')
const axios = require('axios');
const Tool = require('../../Tool/tool')

const getstatistics = require('../statistics/orderStatistic');

const ip = require('ip').address();
const auth = require('../auth/auth');
const jwtSecret = require('../../config/config').jwtSecret;
const jsonwebtoken = require('jsonwebtoken');
const sqlAllianceMerchants = require('../businessAlliance/allianceMerchants')

const client = new OAuth(config.wechat.appId, config.wechat.secret)
const wxpay = new WXPay({
    appId: config.wechat.appId,
    mchId: config.wechat.mchId,
    partnerKey: config.wechat.partnerKey, //微信商户平台API密钥
    pfx: fs.readFileSync('./app/config/apiclient_cert.p12'), //微信商户平台证书
})

module.exports = {

    async onlinePayment(ctx, next){
        ctx.checkBody('tenantId').notBlank()
        ctx.checkBody('tradeNo').notBlank()

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        try{
            let orders = await Orders.findOne({
                where:{
                    tenantId : body.tenantId,
                    trade_no : body.tradeNo,
                }
            })

            if(orders==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此订单信息")
                return
            }

            orders.status = 3

            await orders.save()
            let order = await Orders.findOne({
                where:{
                    tenantId : body.tenantId,
                    trade_no : body.tradeNo,
                }
            })

            let orderJson = {
                trade_no : order.trade_no,
                status : order.status,
                tenantId : order.tenantId,
                isOfflinePayment : order.isOfflinePayment,
                tableId : order.TableId,
                result : "SUCCESS"
            }


            let onlinePaymentCallback = await this.onlinePaymentCallback(orderJson.tenantId, orderJson.tableId,orderJson.trade_no)

            if(onlinePaymentCallback!=true){
                ctx.body = new ApiResult(ApiResult.Result.SUCCESS,onlinePaymentCallback)
                return
            }

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS,[ orderJson ])

        } catch (e){
            ctx.body = new ApiResult(ApiResult.Result.OPERATION_ERROR,[])
        }

    },

    async onlinePaymentCallback(tenantId, tableId,tradeNo){

        try{
            let table = await Tables.findOne({
                where:{
                    id : tableId
                }
            })

            let tenantConfig = await TenantConfigs.findOne({
                where :{
                    tenantId : tenantId
                }
            })
            let order = await Orders.findOne({
                where:{
                    tenantId : tenantId,
                    trade_no : tradeNo,
                }
            })

            let orderGoods = await OrderGoods.findAll({
                where:{
                    tenantId : tenantId,
                    trade_no : tradeNo,
                }
            })
            let FoodNameArray = []
            let totalPrice = 0
            for(let i = 0; i < orderGoods.length; i++){
                let food = await Foods.findById(orderGoods[i].FoodId)
                food.sellCount = food.sellCount + orderGoods[i].num;
                food.todaySales = food.todaySales + orderGoods[i].num;
                await food.save();
                for(let j = 0; j <orderGoods[i].num; j++){
                    let json = {
                        name : orderGoods[i].goodsName,
                        num : orderGoods[i].num
                    }
                    FoodNameArray.push(json)
                }
                totalPrice += orderGoods[i].price*orderGoods[i].num
            }
            let foodArray = FoodNameArray.reduce((accu,curr) => {
                const sameNameEle = accu.find(e => e.name === curr.name)
                if (sameNameEle) {
                    sameNameEle.num += curr.num
                } else {
                    accu.push(curr)
                }
                return accu
            },[])

            console.log(foodArray)
            let aaa = foodArray.map(e=>e.name+"*"+e.num).join()
            let info = order.info==""||order.info==null?"无":order.info
            let status = order.status
            let remark = "订单总价格:  "+totalPrice+"\n"+"商品:  "+aaa+"\n备注信息:  "+info
            console.log(remark)
            if(tenantConfig!=null){
                if (tenantConfig.openIds != null) {

                    let openIds = JSON.parse(tenantConfig.openIds);

                    for (let j = 0; j < openIds.length; j++) {
                        //先获取token

                        let ret1 = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appId}&secret=${config.wechat.secret}`);
                        let token = ret1.data.access_token;

                        await axios.post(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`, {
                            "touser": openIds[j],
                            "template_id": "Etp21FVqbhHEvDMyWjBEU71ahOw9tdoeHkZWXVF4STE",
                            "data": {
                                "first": {
                                    "value": "新订单来啦！",
                                    "color": "#173177"
                                },
                                "keyword1": {
                                    "value": tenantConfig.name,
                                    "color": "#173177"
                                },
                                "keyword2": {
                                    "value": table.name=="0号桌"?order.info:table.name,
                                    "color": "#173177"
                                },
                                "keyword3": {
                                    "value": tradeNo,
                                    "color": "#173177"
                                },
                                "keyword4": {
                                    "value": "线下订单已支付",
                                    "color": "#173177"
                                },
                                "keyword5": {
                                    "value": new Date().toLocaleString(),
                                    "color": "#173177"
                                },
                                "remark": {
                                    "value": remark,
                                    "color": "#173177"
                                }
                            }
                        })
                    }
                }else{
                    return "当前用户未绑定任何openId"
                }
            }else{
                return "未找到当前商户信息"
            }
            return true
        }catch (e){
            return e.message
        }

    },

    // async getOnlinePayment(ctx, next){
    //     let keys = ["tenantId","tableName","startDate","endDate"]
    //     console.log(ctx.query.tenantId)
    //     let condition = keys.reduce((accu, curr) => {
    //         if (ctx.query[curr]) {
    //             accu[curr] = ctx.query[curr]
    //         }
    //         return accu;
    //     }, {})
    //     if(ctx.errors){
    //         ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
    //         return
    //     }
    //     let startTime
    //     if(condition.startTime==null||condition.startTime==""){
    //         startTime = new Date("2000-1-1")
    //     }
    //     let endTime
    //     if(condition.endTime==null||condition.endTime==""){
    //         endTime = new Date()
    //     }
    //
    //     // let pageNumber = parseInt(ctx.query.pageNumber);
    //     //
    //     // if(pageNumber<1){
    //     //     pageNumber=1
    //     // }
    //     //
    //     // let pageSize = parseInt(ctx.query.pageSize);
    //     // if(pageSize<1){
    //     //     pageSize=1
    //     // }
    //     // let place = (pageNumber - 1) * pageSize;
    //     // let limitJson = {}
    //     // if(pageNumber!=null&&pageNumber!=""&&pageSize!=null&&pageSize!=""){
    //     //     limitJson = {
    //     //         offset: Number(place),
    //     //         limit: Number(pageSize)
    //     //     }
    //     // }
    //     try{
    //
    //         if(condition.tableName!=null){
    //
    //             let table = await Tables.findOne({
    //                 where:{
    //                     tenantId : ctx.query.tenantId,
    //                     name : ctx.query.tableName,
    //                 }
    //             })
    //             condition.TableId = table.id
    //             delete condition.tableName
    //             if(table==null){
    //                 ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此房间号")
    //                 return
    //             }
    //         }
    //
    //         condition.isOfflinePayment = 1
    //
    //         condition.status = 1
    //         //查询所有线下支付的订单
    //
    //         let orders = await Orders.findAll({
    //             where:condition
    //             // limitJson
    //         })
    //
    //         if(orders.length==0){
    //             ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此订单信息")
    //             return
    //         }
    //         let orderArray = []
    //         for(let i = 0; i < orders.length; i++){
    //             let tradeNo = orders[i].trade_no
    //             let ordersGoods = await OrderGoods.findAll({
    //                 where:{
    //                     tenantId : ctx.query.tenantId,
    //                     trade_no : tradeNo
    //                 }
    //             })
    //             let totalPrice = 0
    //             for(let j = 0; j<ordersGoods.length; j++){
    //                 totalPrice += ordersGoods[j].num*ordersGoods[j].price
    //             }
    //             orders[i].dataValues.orderGoods = ordersGoods
    //             orders[i].dataValues.totalPrice = totalPrice
    //             orderArray.push(orders[i].dataValues)
    //         }
    //         ctx.body = new ApiResult(ApiResult.Result.SUCCESS,orderArray)
    //     }catch(e){
    //         ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,e)
    //         return
    //     }
    // },

    // async onlinePaymentByCarryOut(ctx, next){
    //
    //     // ctx.checkBody('tenantId').notBlank()
    //     // ctx.checkBody('tradeNo').notBlank()
    //     let body = ctx.request.body
    //     let key = ["tenantId","trade_no","tableName"]
    //     let condition = key.reduce((accu,curr)=>{
    //         if(body[curr]){
    //             accu[curr] = body[curr]
    //         }
    //         return accu
    //     },{})
    //
    //     try{
    //         // let tableJson = {}
    //         // console.log(2222222222222)
    //         if(condition.tableName!=null){
    //
    //             let table = await Tables.findOne({
    //                 where:{
    //                     tenantId : condition.tenantId,
    //                     name : condition.tableName
    //                 }
    //             })
    //             condition.TableId = table.id
    //             delete condition.tableName
    //         }
    //
    //         // let trade_noJson = {}
    //         if(condition.trade_no!=null){
    //             if(Tool.isArray(condition.trade_no)){
    //
    //                 condition.trade_no = {
    //                     $in : condition.trade_no
    //                 }
    //
    //             }else{
    //                 ctx.body = new ApiResult(ApiResult.Result.TYPE_ERROR,"trade_no必须是数组")
    //                 return
    //             }
    //         }
    //         condition.isOfflinePayment = 1
    //         condition.status = 1
    //         let orders = await Orders.findAll({
    //             where: condition
    //         })
    //         if(orders.length==0){
    //             ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此订单信息")
    //             return
    //         }
    //         // console.log(444444444444444444)
    //         for(let o of orders){
    //             o.status = 2
    //             await o.save()
    //         }
    //     }catch (e){
    //         ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,e.message)
    //         return
    //     }
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    // },

    async  getWechatInfo(ctx, next) {
        var token = await client.getAccessToken(ctx.query.code);
        var openid = token.data.openid;
        var userInfo = await client.getUser(openid);
        console.log("userInfo====" + JSON.stringify(userInfo));
        let ret = await axios.post('http://api.wechat.huizhanren.cn/api/wxFans/', {
            OpenId: openid,
            nickname: userInfo.nickname,
            Headimgurl:userInfo.headimgurl,
            CustomerId:'0630046f-54e0-4724-b30a-303482024be0'
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, userInfo)
    },

    async userDealRedirect(ctx, next) {
        //const path = ctx.query.path
        //初始回调地址前台做转发用不用改
        const auth_callback_url = `http://deal.xiaovbao.cn/wechatpay`

        // const auth_callback_url = 'http://119.29.180.92/user'

        console.log(`auth_callback_url: ${auth_callback_url}`)

        const url = client.getAuthorizeURL(auth_callback_url, config.wechat.state, 'snsapi_base')
        console.log(`redirect url: ${url}`)
        // 重定向请求到微信服务器
        //ctx.redirect(url);

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, url)
        console.log(`start: ${new Date()}`)
    },

    async userEshopRedirect(ctx, next) {
        //const path = ctx.query.path
        //初始回调地址前台做转发用不用改
        const auth_callback_url = `http://deal.xiaovbao.cn/wechatpay`

        // const auth_callback_url = 'http://119.29.180.92/user'

        console.log(`auth_callback_url: ${auth_callback_url}`)

        const url = client.getAuthorizeURL(auth_callback_url, config.wechat.state, 'snsapi_base')
        console.log(`redirect url: ${url}`)
        // 重定向请求到微信服务器
        //ctx.redirect(url);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, url)
        console.log(`start: ${new Date()}`)
    },

    async userEshopOpenIdRedirect(ctx, next) {
        //const path = ctx.query.path
        //初始回调地址前台做转发用不用改
        const auth_callback_url = `http://deal.xiaovbao.cn/wechatpay`

        // const auth_callback_url = 'http://119.29.180.92/user'

        console.log(`auth_callback_url: ${auth_callback_url}`)

        const url = client.getAuthorizeURL(auth_callback_url, 'openid', 'snsapi_base')
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

    async getOpenId(ctx, next) {
        const token = await client.getAccessToken(ctx.query.code);
        console.log(ctx.query.code)

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, {openId: token.data.openid})
    },

    async getMyOpenId(code) {
        const token = await client.getAccessToken(code);

        return token.data.openid
    },
    async  getTenantIdsByCode(ctx, next) {
        try {
            const token = await client.getAccessToken(ctx.query.code);
            console.log(ctx.query.code)
            let openId = token.data.openid;

            console.log("-----openId===" + openId);

            //通过openId查找租户
            let tenantConfigs = await TenantConfigs.findAll({
                where: {
                    openIds: {
                        $like: `%${openId}%`
                    }
                }
            });

            if (tenantConfigs.length == 0) {
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"未绑定微信账号")
                return;
            }



            let ret = [];

            for (let i = 0; i<tenantConfigs.length;i++) {
                let correspondingJson = {
                    correspondingId: tenantConfigs[i].tenantId
                }

                let admin = await auth.getadmin(correspondingJson);

                let tmpToken = jsonwebtoken.sign({phone: admin.phone}, jwtSecret, {expiresIn: 5 * 60})

                let merchant = await Merchants.findOne({
                    where: {
                        tenantId: tenantConfigs[i].tenantId
                    }
                })

                let tenantJson = {
                    tenantId: tenantConfigs[i].tenantId
                }
                let getOperation = await sqlAllianceMerchants.getOperation(AllianceMerchants, tenantJson)

                ret.push({
                    alliancesId: getOperation == null ? "" : getOperation.alliancesId,
                    tenantId: tenantConfigs[i].tenantId,
                    correspondingType: admin.correspondingType,
                    style: admin.style,
                    name: admin.nickname,
                    aliasName: merchant == null ? "" : merchant.name,
                    token:tmpToken
                })
            }

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, ret)
        } catch(e) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,e.message);
            return;
        }


    },



    async getUserDealWechatPayParams(ctx, next) {
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
        let order = await Orders.findOne({
            where: {
                //trade_no:trade_no,
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

        let trade_no = order.trade_no;

        //首单折扣，-1表示不折扣，根据手机号和租户id
        let firstDiscount = await orderManager.getFirstDiscount(order.phone, ctx.query.tenantId);

        //根据订单查询需要支付多少
        total_amount = await orderManager.getOrderPriceByOrder(order, firstDiscount);

        //微信新订单号
        let wechat_trade_no = trade_no + String(parseInt(Math.random() * 8999 + 1000));

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
            nickname: order.phone,
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
            out_trade_no: wechat_trade_no,
            total_fee: parseFloat(total_amount) * 100,//分
            trade_type: 'JSAPI',
            spbill_create_ip: ip,
            notify_url: config.wechat.notify_url
        })
        new_params.trade_no = wechat_trade_no;

        console.log(new_params)

        let app_id = new_params.appId;

        //判断是否再次生成params
        //tableId and order状态不等于1-待支付状态（order满足一个就行）
        //且未超时失效,微信貌似没有超时的说法，预留着，10分钟

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
                //paymentMethod: '微信',
                isFinish: false,
                isInvalid: false,
                tenantId: ctx.query.tenantId,
                consigneeId: null
            }
        });

        if (order1 != null && paymentReqs.length > 0) {
            //判断是否失效 10min,微信不判断超时
            //if((Date.now() - paymentReqs[0].createdAt.getTime()) > 100*60*1000) {
            paymentReqs[0].isInvalid = true;
            await paymentReqs[0].save();

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
                firstDiscount: firstDiscount,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: ctx.query.tenantId
            });


            order.paymentMethod = '微信';
            await order.save();

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
                firstDiscount: firstDiscount,
                TransferAccountIsFinish: false,
                consigneeTransferAccountIsFinish: false,
                tenantId: ctx.query.tenantId
            });


            order.status = 1;//待支付
            order.paymentMethod = '微信';
            await order.save();

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        }

    },

    async getUserEshopWechatPayParams(ctx, next) {
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
        let order = await Orders.findOne({
            where: {
                //trade_no:trade_no,
                TableId: table.id,
                $or: [{status: 0}, {status: 1}],
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                phone: ctx.query.phoneNumber,
                isOfflinePayment : {
                    $ne : true
                }
            }
        })

        if (order == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '订单不存在！请重新下单！')
            return;
        }

        let trade_no = order.trade_no;
        console.log(trade_no)

        //首单折扣，-1表示不折扣，根据手机号和租户id
        let firstDiscount = await orderManager.getFirstDiscount(order.phone, ctx.query.tenantId);

        //首杯半价
        let firstOrderDiscount = await orderManager.getFirstOrderDiscount(order);
        let firstOrder = false;
        if (firstOrderDiscount != 0) {
            firstOrder = true;
        }

        //根据订单查询需要支付多少
        total_amount = await orderManager.getOrderPriceByOrder(order, firstDiscount, firstOrderDiscount);

        //微信新订单号
        let wechat_trade_no = trade_no + String(parseInt(Math.random() * 8999 + 1000));


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
            nickname: order.phone,
            headimgurl: '',
            sex: 1,
            openid: token.data.openid,
            subscribe_time: new Date(),
            unionid: 'unionidss'
        });

        const fn = co.wrap(wxpay.getBrandWCPayRequestParams.bind(wxpay))
        //
        console.log("total_amount ============" + total_amount);

        let new_params = await fn({
            openid: token.data.openid,
            body: merchant + '-' + tableName + '账单',
            //  detail: '公众号支付测试',
            out_trade_no: wechat_trade_no,
            total_fee: parseFloat(total_amount) * 100,//分
            trade_type: 'JSAPI',
            spbill_create_ip: ip,
            notify_url: config.wechat.notify_url
        })
        new_params.trade_no = wechat_trade_no;

        console.log(new_params)

        let app_id = new_params.appId;

        //判断是否再次生成params
        //tableId and order状态不等于1-待支付状态（order满足一个就行）
        //且未超时失效,微信貌似没有超时的说法，预留着，10分钟

        let order1 = await Orders.findOne({
            where: {
                trade_no: trade_no,
                TableId: table.id,
                status: 1,//待支付
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                phone: ctx.query.phoneNumber
            }
        })

        //通过tableId，isFinish-false，isInvalid-false
        let paymentReqs = await PaymentReqs.findAll({
            where: {
                tableId: table.id,
                // paymentMethod: '微信',
                isFinish: false,
                isInvalid: false,
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId,
                phoneNumber: ctx.query.phoneNumber
            }
        });

        if (order != null && paymentReqs.length > 0) {
            //判断是否失效 10min,微信不判断超时
            //if((Date.now() - paymentReqs[0].createdAt.getTime()) > 100*60*1000) {
            paymentReqs[0].isInvalid = true;
            await paymentReqs[0].save();

            await PaymentReqs.create({
                params: JSON.stringify(new_params),
                tableId: table.id,
                paymentMethod: '微信',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                wechat_trade_no: wechat_trade_no,
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

            order.paymentMethod = '微信';
            await order.save();

            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        } else {
            await PaymentReqs.create({
                params: JSON.stringify(new_params),
                tableId: table.id,
                paymentMethod: '微信',
                isFinish: false,
                isInvalid: false,
                trade_no: trade_no,
                wechat_trade_no: wechat_trade_no,
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
            order.paymentMethod = '微信';
            await order.save();
            console.log("支付完成下面进入回调")
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, new_params)
        }

    },

    async wechatPayNotify(ctx, next) {
        console.log("进入微信回调")
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
        console.log(trade_no)
        if (sign !== xml.sign[0]) {
            AlipayErrors.create({
                errRsp: JSON.stringify(ctx.xmlBody),
                signFlag: false,
            });
        } else {
            console.log(JSON.stringify({
                trade_no: trade_no,
                app_id: xml.appid,
                total_amount: xml.total_fee / 100,
                paymentMethod: '微信',
                isFinish: false,
                isInvalid: false
            }, null, 2));

            //优惠券使用状态修改
            let coupon = await Coupons.findOne({
                where: {
                    trade_no: trade_no,
                    status: 0
                }
            })

            if (coupon != null) {
                coupon.status = 1;
                await coupon.save();
            }

            let orders = await OrderGoods.findAll({
                where: {
                    trade_no: trade_no
                }
            })
            let FoodNameArray = []
            // let foodNumArray = []
            //根据查询到的foodId在菜单中查询当前的菜
            for (let i = 0; i < orders.length; i++) {
                let food = await Foods.findById(orders[i].FoodId);
                food.sellCount = food.sellCount + orders[i].num;
                food.todaySales = food.todaySales + orders[i].num;
                await food.save();
                for(let j = 0; j <orders[i].num; j++){
                    let json = {
                        name : orders[i].goodsName,
                        num : orders[i].num
                    }
                    FoodNameArray.push(json)
                }
            }

            let foodArray = FoodNameArray.reduce((accu,curr) => {
                const sameNameEle = accu.find(e => e.name === curr.name)
                if (sameNameEle) {
                    sameNameEle.num += curr.num
                } else {
                    accu.push(curr)
                }
                return accu
            },[])

            console.log(foodArray)
            let aaa = foodArray.map(e=>e.name+"*"+e.num).join()

            let paymentReqs = await PaymentReqs.findAll({
                where: {
                    trade_no: trade_no,
                    app_id: xml.appid,
                    total_amount: xml.total_fee / 100,
                    paymentMethod: '微信',
                    isFinish: false,
                    isInvalid: false
                }
            });
            console.log("trade_no=" + trade_no);
            console.log("app_id=" + xml.appid);
            console.log("total_amount=" + parseFloat(xml.total_fee));
            console.log("paymentReqs.length+======"+paymentReqs.length)
            if (paymentReqs.length > 0) {

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
                let order = await Orders.findOne({
                    where: {
                        TableId: tableId,
                        $or: [{status: 0}, {status: 1}],
                        tenantId: tenantId,
                        consigneeId: consigneeId,
                        trade_no: trade_no,
                    },
                    paranoid: false
                });

                order.status = 2;
                await order.save();

                //如果订单超时删除，恢复
                if (order.deletedAt != null) {
                    await Orders.update({
                        deletedAt: null
                    }, {
                        where: {
                            trade_no: trade_no,
                            status: {
                                $gte: 2
                            },
                            deletedAt: {
                                $ne: null
                            }
                        },
                        paranoid: false
                    });
                }

                paymentReqs[0].isFinish = true;
                await paymentReqs[0].save();

                //查找主商户信息
                let tenantConfig = await TenantConfigs.findOne({
                    where: {
                        tenantId: tenantId
                    }
                });
                let info = order.info==""||order.info==null?"无":order.info


                //查找代售商户信息
                let consignee = await Consignees.findOne({
                    where: {
                        consigneeId: consigneeId
                    }
                });

                //根据tenantId，consigneeId，订单号获取分成转账金额
                //input:tenantId,consigneeId,trade_no
                //output:object（总金额，租户金额，代售金额）

                let amountJson
                console.log("order================"+order)
                amountJson= await amountManager.getTransAccountAmount(tenantId, consigneeId, trade_no, '微信', 0);
                console.log(amountJson)
                let allianceMerchants = await AllianceMerchants.findOne({
                    where:{
                        tenantId :tenantId
                    }
                })
                let customerVips
                if(allianceMerchants!=null){
                    customerVips = await Vips.findOne({
                        where: {
                            phone: order.phone,
                            alliancesId: allianceMerchants.alliancesId
                        }
                    });
                }else{
                    customerVips = await Vips.findOne({
                        where: {
                            phone: order.phone,
                            tenantId: tenantId
                        }
                    });
                }

                let isVip = false
                if (customerVips!=null) {
                    isVip = true
                }
                let customerJson = {
                    tenantId: tenantId,
                    phone: order.phone,
                    status: 3,
                    foodName: JSON.stringify(FoodNameArray),
                    totalPrice: amountJson.totalPrice,
                    isVip: isVip
                }
                await customer.saveCustomer(customerJson);
                console.log(Merchants)
                let merchant = await Merchants.findOne({
                    where:{
                        tenantId :tenantId
                    }
                })

                let pay = "微信"
                if(isVip){
                    // console.log("1111111111111111111111111111111111111111111111111111111111111111")
                    let integralAllo= await amountManager.integralAllocation(trade_no,tenantId,order.phone,amountJson.totalPrice,pay)
                    // console.log("22222222222222222222222222222222222222222222222222222222222222222222222222")
                    // console.log("积分分配是否有错,看integralAllocation是不是-1"+integralAllo)
                    if(integralAllo=="-1"){
                        ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"商家积分不足")
                        return
                    }
                }
                // console.log(11111111111111111111111111111111)

                try {

                    amountJson.style = merchant==null?null:merchant.style;
                    amountJson.tenantId = tenantId;
                    amountJson.consigneeId = consigneeId;
                    amountJson.phone = order.phone;
                    amountJson.trade_no = trade_no;
                    console.log(amountJson+"111111111111111111111111")
                    // console.log("amountJson===="+amountJson)
                    await getstatistics.setOrders(amountJson);
                } catch (e) {
                    console.log(e);
                }

                console.log("amountJson = " + JSON.stringify(amountJson, null, 2));

                //支付完成推送支付成功消息
                let date = new Date().format("hh:mm");
                let content;
                if (consignee != null) {
                    content = '代售商:' + consignee.name + ' ' + table.name + ' 已结账 订单总价： ' + amountJson.totalPrice + '元 ' + date;
                } else {
                    content = table.name + ' 已结账 订单总价： ' + amountJson.totalPrice + '元 ' + date;
                }
                infoPushManager.infoPush(content, tenantId);

                if (tenantConfig != null) {

                    if (tenantConfig.openIds != null) {

                        let openIds = JSON.parse(tenantConfig.openIds);
                        console.log(openIds.length)
                        console.log(openIds)
                        let remark = "订单总价格:  "+amountJson.totalPrice+"\n"+"商品:  "+aaa+"\n备注信息:  "+info
                        for (let j = 0; j < openIds.length; j++) {
                            //先获取token

                            let ret1 = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appId}&secret=${config.wechat.secret}`);
                            let token = ret1.data.access_token;

                            await axios.post(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`, {
                                "touser": openIds[j],
                                "template_id": "Etp21FVqbhHEvDMyWjBEU71ahOw9tdoeHkZWXVF4STE",
                                "data": {
                                    "first": {
                                        "value": "新订单来啦！",
                                        "color": "#173177"
                                    },
                                    "keyword1": {
                                        "value": tenantConfig.name,
                                        "color": "#173177"
                                    },
                                    "keyword2": {
                                        "value": table.name=="0号桌"?order.info:table.name,
                                        "color": "#173177"
                                    },
                                    "keyword3": {
                                        "value": trade_no,
                                        "color": "#173177"
                                    },
                                    "keyword4": {
                                        "value": "已支付",
                                        "color": "#173177"
                                    },
                                    "keyword5": {
                                        "value": new Date().toLocaleString(),
                                        "color": "#173177"
                                    },
                                    "remark": {
                                        "value": remark,
                                        "color": "#173177"
                                    }
                                }
                            })
                        }
                    }

                    if (tenantConfig.isRealTime) {
                        //判断商户是否开启利润分配
                        if(!tenantConfig.isProfitRate){
                            console.log("服务器公网IP：" + ip);
                            let params;
                            let result;
                            fn = co.wrap(wxpay.transfers.bind(wxpay))
                            if (consignee == null) {
                                params = {
                                    partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                    openid: tenantConfig.wecharPayee_account,
                                    check_name: 'NO_CHECK',
                                    amount: Math.round(amountJson.totalAmount * 100),
                                    //desc: tenantConfig.remark,
                                    desc: '收益',
                                    spbill_create_ip: ip
                                }
                                console.log(params)
                                try {
                                    result = await fn(params);
                                    console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result, null, 2));
                                    if (result.result_code == 'SUCCESS') {
                                        paymentReqs[0].TransferAccountIsFinish = true;
                                        await paymentReqs[0].save();
                                    } else {
                                        if (amountJson.totalAmount > 0) {
                                            await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, amountJson.totalAmount, '收益', '微信', '租户', tenantId, consigneeId);
                                        }
                                    }
                                } catch (e) {
                                    console.log(e);
                                }
                            } else {
                                console.log(ProfitSharings)
                                let profitsharing = await ProfitSharings.findOne({
                                    where: {
                                        tenantId: tenantId,
                                        consigneeId: consigneeId
                                    }
                                });
                                console.log(consigneeId)
                                console.log(tenantId)
                                console.log(profitsharing)
                                // console.log(consigneeId)
                                if (profitsharing == null) {
                                    params = {
                                        partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                        openid: tenantConfig.wecharPayee_account,
                                        check_name: 'NO_CHECK',
                                        amount: Math.round(amountJson.totalAmount * 100),//分
                                        //desc: tenantConfig.remark,
                                        desc: '收益',
                                        spbill_create_ip: ip
                                    }

                                    try {
                                        result = await fn(params);
                                        console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT1result:" + JSON.stringify(result, null, 2));
                                        if (result.result_code == 'SUCCESS') {
                                            paymentReqs[0].TransferAccountIsFinish = true;
                                            await paymentReqs[0].save();
                                        } else {
                                            if (amountJson.totalAmount > 0) {
                                                await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, amountJson.totalAmount, '收益', '微信', '租户', tenantId, consigneeId);
                                            }
                                        }
                                    } catch (e) {
                                        console.log(e);
                                    }
                                } else {
                                    //找到对应关系
                                    console.log("主商户分润：" + amountJson.merchantAmount);
                                    params = {
                                        partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                        openid: tenantConfig.wecharPayee_account,
                                        check_name: 'NO_CHECK',
                                        amount: Math.round(amountJson.merchantAmount * 100),
                                        desc: profitsharing.merchantRemark,
                                        spbill_create_ip: ip
                                    }

                                    try {
                                        result = await fn(params);
                                        console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT2result:" + JSON.stringify(result, null, 2));
                                        if (result.result_code == 'SUCCESS') {
                                            paymentReqs[0].TransferAccountIsFinish = true;
                                            await paymentReqs[0].save();

                                            //主商户转账成功才能给代售商户转账
                                            console.log("代售点分润：" + amountJson.consigneeAmount);
                                            params = {
                                                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                                openid: consignee.wecharPayee_account,
                                                check_name: 'NO_CHECK',
                                                amount: Math.round(amountJson.consigneeAmount * 100),
                                                desc: profitsharing.consigneeRemark,
                                                spbill_create_ip: ip
                                            }

                                            result = await fn(params);
                                            console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3result:" + JSON.stringify(result, null, 2));
                                            if (result.result_code == 'SUCCESS') {
                                                paymentReqs[0].consigneeTransferAccountIsFinish = true;
                                                await paymentReqs[0].save();
                                            } else {
                                                if (amountJson.consigneeAmount > 0) {
                                                    await transAccounts.pendingTransferAccounts(trade_no, consignee.wecharPayee_account, amountJson.consigneeAmount, profitsharing.consigneeRemark, '微信', '代售', tenantId, consigneeId);
                                                }
                                            }
                                        } else {

                                            if (amountJson.merchantAmount > 0) {
                                                await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, amountJson.merchantAmount, profitsharing.merchantRemark, '微信', '租户', tenantId, consigneeId);
                                            }
                                            if (amountJson.consigneeAmount > 0) {
                                                await transAccounts.pendingTransferAccounts(trade_no, consignee.wecharPayee_account, amountJson.consigneeAmount, profitsharing.consigneeRemark, '微信', '代售', tenantId, consigneeId);
                                            }
                                        }
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }
                            }
                        }else{
                            //商户开启利润分配
                            console.log("服务器公网IP：" + ip);
                            let params;
                            let result;
                            fn = co.wrap(wxpay.transfers.bind(wxpay))
                            console.log("77777777777777777777777777")
                            //获取利润分配后的商户所得到的价格
                            let getProfitRate = await amountManager.getProfitRate(tenantId,trade_no,"weixin")
                            //判断是否有代售点
                            if (consignee == null) {
                                //如果没有代售点
                                params = {
                                    partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                    openid: tenantConfig.wecharPayee_account,
                                    check_name: 'NO_CHECK',
                                    amount: Math.round(getProfitRate.merchantTotalPrice * 100),
                                    //desc: tenantConfig.remark,
                                    desc: '收益',
                                    spbill_create_ip: ip
                                }

                                try {
                                    result = await fn(params);
                                    console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result, null, 2));
                                    if (result.result_code == 'SUCCESS') {
                                        paymentReqs[0].TransferAccountIsFinish = true;
                                        await paymentReqs[0].save();
                                    } else {
                                        if (amountJson.totalAmount > 0) {
                                            await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, amountJson.totalAmount, '收益', '微信', '租户', tenantId, consigneeId);
                                        }
                                    }
                                } catch (e) {
                                    console.log(e);
                                }
                            } else {
                                console.log(ProfitSharings)
                                let profitsharing = await ProfitSharings.findOne({
                                    where: {
                                        tenantId: tenantId,
                                        consigneeId: consigneeId
                                    }
                                });
                                console.log(consigneeId)
                                console.log(tenantId)
                                console.log(profitsharing)
                                // console.log(consigneeId)
                                if (profitsharing == null) {
                                    params = {
                                        partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                        openid: tenantConfig.wecharPayee_account,
                                        check_name: 'NO_CHECK',
                                        amount: Math.round(getProfitRate.merchantTotalPrice * 100),//分
                                        //desc: tenantConfig.remark,
                                        desc: '收益',
                                        spbill_create_ip: ip
                                    }

                                    try {
                                        result = await fn(params);
                                        console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT1result:" + JSON.stringify(result, null, 2));
                                        if (result.result_code == 'SUCCESS') {
                                            paymentReqs[0].TransferAccountIsFinish = true;
                                            await paymentReqs[0].save();
                                        } else {
                                            if (amountJson.totalAmount > 0) {
                                                await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, getProfitRate.merchantTotalPrice, '收益', '微信', '租户', tenantId, consigneeId);
                                            }
                                        }
                                    } catch (e) {
                                        console.log(e);
                                    }
                                } else {
                                    //因为开启了商户利润分配所以商户和代售点就没有利润的说法，一切以商户的利润比率来算
                                    //找到对应关系
                                    // console.log("主商户分润：" + amountJson.merchantAmount);
                                    params = {
                                        partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                        openid: tenantConfig.wecharPayee_account,
                                        check_name: 'NO_CHECK',
                                        amount: Math.round(getProfitRate.merchantTotalPrice * 100),
                                        desc: profitsharing.merchantRemark,
                                        spbill_create_ip: ip
                                    }

                                    try {
                                        result = await fn(params);
                                        console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT2result:" + JSON.stringify(result, null, 2));
                                        if (result.result_code == 'SUCCESS') {
                                            paymentReqs[0].TransferAccountIsFinish = true;
                                            await paymentReqs[0].save();

                                            //主商户转账成功才能给代售商户转账
                                            // console.log("代售点分润：" + amountJson.consigneeAmount);
                                            // params = {
                                            //     partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                                            //     openid: consignee.wecharPayee_account,
                                            //     check_name: 'NO_CHECK',
                                            //     amount: Math.round(amountJson.consigneeAmount * 100),
                                            //     desc: profitsharing.consigneeRemark,
                                            //     spbill_create_ip: ip
                                            // }
                                            //
                                            // result = await fn(params);
                                            // console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3result:" + JSON.stringify(result, null, 2));
                                            // if (result.result_code == 'SUCCESS') {
                                            //     paymentReqs[0].consigneeTransferAccountIsFinish = true;
                                            //     await paymentReqs[0].save();
                                            // } else {
                                            //     if (amountJson.consigneeAmount > 0) {
                                            //         await transAccounts.pendingTransferAccounts(trade_no, consignee.wecharPayee_account, amountJson.consigneeAmount, profitsharing.consigneeRemark, '微信', '代售', tenantId, consigneeId);
                                            //     }
                                            // }
                                        } else {
                                            if(getProfitRate.merchantTotalPrice>0){
                                                await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, getProfitRate.merchantTotalPrice, profitsharing.merchantRemark, '微信', '租户', tenantId, consigneeId);
                                            }
                                            // if (amountJson.merchantAmount > 0) {
                                            //     await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, amountJson.merchantAmount, profitsharing.merchantRemark, '微信', '租户', tenantId, consigneeId);
                                            // }
                                            // if (amountJson.consigneeAmount > 0) {
                                            //     await transAccounts.pendingTransferAccounts(trade_no, consignee.wecharPayee_account, amountJson.consigneeAmount, profitsharing.consigneeRemark, '微信', '代售', tenantId, consigneeId);
                                            // }
                                        }
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }
                            }
                        }

                    } else {
                        if(tenantConfig.isProfitRate){
                            let getProfitRate = await amountManager.getProfitRate(tenantId,trade_no)
                            if (consignee == null) {
                                if (getProfitRate.merchantTotalPrice > 0) {
                                    await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, getProfitRate.merchantTotalPrice, '收益', '微信', '租户', tenantId, consigneeId);
                                }
                            } else {
                                let profitsharing = await ProfitSharings.findOne({
                                    where: {
                                        tenantId: tenantId,
                                        consigneeId: consigneeId
                                    }
                                });
                                if (profitsharing == null) {
                                    if (getProfitRate.merchantTotalPrice > 0) {
                                        await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, getProfitRate.merchantTotalPrice, '收益', '微信', '租户', tenantId, consigneeId);
                                    }
                                } else {
                                    console.log("66666666666666666666666666")
                                    if (getProfitRate.merchantTotalPrice > 0) {
                                        await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, getProfitRate.merchantTotalPrice, profitsharing.merchantRemark, '微信', '租户', tenantId, consigneeId);
                                    }
                                }
                            }
                        }else{
                            if (consignee == null) {
                                if (amountJson.totalAmount > 0) {
                                    await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, amountJson.totalAmount, '收益', '微信', '租户', tenantId, consigneeId);
                                }
                            } else {
                                let profitsharing = await ProfitSharings.findOne({
                                    where: {
                                        tenantId: tenantId,
                                        consigneeId: consigneeId
                                    }
                                });

                                if (profitsharing == null) {
                                    if (amountJson.totalAmount > 0) {
                                        await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, amountJson.totalAmount, '收益', '微信', '租户', tenantId, consigneeId);
                                    }
                                } else {
                                    if (amountJson.merchantAmount > 0) {
                                        await transAccounts.pendingTransferAccounts(trade_no, tenantConfig.wecharPayee_account, amountJson.merchantAmount, profitsharing.merchantRemark, '微信', '租户', tenantId, consigneeId);
                                    }
                                    if (amountJson.consigneeAmount > 0) {
                                        await transAccounts.pendingTransferAccounts(trade_no, consignee.wecharPayee_account, amountJson.consigneeAmount, profitsharing.consigneeRemark, '微信', '代售', tenantId, consigneeId);
                                    }
                                }
                            }
                        }

                    }
                }
            } else {
                AlipayErrors.create({
                    errRsp: JSON.stringify(ctx.xmlBody),
                    signFlag: true,
                });
            }
        }

        ctx.body = "SUCCESS";

        //通知管理台修改桌态
        if (tableId != 0) {
            var json = {"tableId": tableId, "status": 0};
            webSocket.sendSocket(JSON.stringify(json));
        }
    },


    async transfers(ctx, next) {
        //const ip = ctx.request.headers['x-real-ip']

        var ip = Ip.address();
        console.log("服务器公网IP：" + ip);
        const params = {
            partner_trade_no: Date.now(), //商户订单号，需保持唯一性
            openid: 'oeGC00rSlKScZMw7g9Bz3xj5hrsc',
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

    async dealWechatRefund(ctx, next) {
        ctx.checkBody('tradeNo').notEmpty();
        ctx.checkBody('refundAmount').notEmpty();
        ctx.checkBody('refundReason').notEmpty();
        ctx.checkBody('tenantId').notEmpty();

        var body = ctx.request.body;

        var paymentReqs = await PaymentReqs.findAll({
            where: {
                trade_no: body.tradeNo,
                paymentMethod: '微信',
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


        var params = {
            out_refund_no: Date.now(),
            total_fee: paymentReqs[0].total_amount * 100, //原支付金额
            refund_fee: body.refundAmount * 100, //退款金额
            //transaction_id: '4006422001201706155802694657',
            refund_desc: body.refundReason,
            //out_trade_no:'1498125730292'
            out_trade_no: body.tradeNo
        }

        const fn = co.wrap(wxpay.refund.bind(wxpay))

        try {
            const result = await fn(params);
            console.log("KKKKKKKKKKKKKKKKKKKKKKKK-退款结果：" + JSON.stringify(result, null, 2));

            if (result.result_code == 'SUCCESS') {
                paymentReqs[0].refund_amount = paymentReqs[0].refund_amount + result.refund_fee / 100;
                paymentReqs[0].actual_amount = paymentReqs[0].total_amount - paymentReqs[0].refund_amount;
                paymentReqs[0].refund_reason = body.refundReason;
                await paymentReqs[0].save();

                ctx.body = {
                    resCode: 0,
                    //resMsg:result.err_code_des,
                    resMsg: 'SUCCESS'
                };
            } else {
                ctx.body = {
                    resCode: -1,
                    //resMsg:result.err_code_des,
                    resMsg: result.err_code_des
                };
            }

        } catch (e) {
            console.log(e);
            ctx.body = {
                resCode: -2,
                resMsg: e
            }
        }
    },


    async eshopWechatRefund(ctx, next) {
        ctx.checkBody('tradeNo').notEmpty();
        ctx.checkBody('refundAmount').notEmpty();
        ctx.checkBody('refundReason').notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('consigneeId').notEmpty();

        var body = ctx.request.body;

        var paymentReqs = await PaymentReqs.findAll({
            where: {
                trade_no: body.tradeNo,
                paymentMethod: '微信',
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

        var params = {
            out_refund_no: Date.now(),
            total_fee: paymentReqs[0].total_amount * 100, //原支付金额
            refund_fee: body.refundAmount * 100, //退款金额
            //transaction_id: '4006422001201706155802694657',
            refund_desc: body.refundReason,
            //out_trade_no:'1498125730292'
            out_trade_no: body.tradeNo
        }

        const fn = co.wrap(wxpay.refund.bind(wxpay))

        try {
            const result = await fn(params);
            console.log("KKKKKKKKKKKKKKKKKKKKKKKK-退款结果：" + JSON.stringify(result, null, 2));

            if (result.result_code == 'SUCCESS') {
                paymentReqs[0].refund_amount = paymentReqs[0].refund_amount + result.refund_fee / 100;
                paymentReqs[0].actual_amount = paymentReqs[0].total_amount - paymentReqs[0].refund_amount;
                paymentReqs[0].refund_reason = body.refundReason;
                await paymentReqs[0].save();

                ctx.body = {
                    resCode: 0,
                    //resMsg:result.err_code_des,
                    resMsg: 'SUCCESS'
                };
            } else {
                ctx.body = {
                    resCode: -1,
                    //resMsg:result.err_code_des,
                    resMsg: result.err_code_des
                };
            }

        } catch (e) {
            console.log(e);
            ctx.body = {
                resCode: -2,
                resMsg: e
            }
        }
    },

    //手动转账接口
    async mounthTransferAccounts (tenantId) {
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
        // console.log(Number(merchantAmount))
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
            console.log((merchantAmount * 100))
            var params = {
                partner_trade_no: Date.now(), //商户订单号，需保持唯一性
                openid: tenantConfig.wecharPayee_account,
                check_name: 'NO_CHECK',
                amount:  Math.round((merchantAmount * 100)),
                desc: '日收益',
                spbill_create_ip: ip
            }

            try {
                console.log(11111111111)
                var result = await fn(params);
                console.log(result)
                // console.log("定时器TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT0result:" + JSON.stringify(result, null, 2));
                if (result.result_code == 'SUCCESS') {

                    let paymentReqs = await PaymentReqs.findAll({
                        where: {
                            tenantId: tenantId,
                            consigneeId: consignees==null?"":consignees.consigneeId,
                            paymentMethod: '微信',
                            isFinish: true,
                            isInvalid: false,
                            TransferAccountIsFinish: false,
                            consigneeTransferAccountIsFinish: false
                        }
                    });
                    console.log(22222222222)
                    for (var j = 0; j < paymentReqs.length; j++) {
                        paymentReqs[j].TransferAccountIsFinish = true;
                        await paymentReqs[j].save();
                    }
                    console.log(3333333333333)
                    //待转账表状态修改从0-1
                    transferAccounts = await TransferAccounts.findAll({
                        where: {
                            tenantId: tenantId,
                            consigneeId: consignees.consigneeId,
                            paymentMethod: '微信',
                            role: '租户',
                            status: 0
                        }
                    })
                    console.log(44444444444)
                    for (var k = 0; k < transferAccounts.length; k++) {
                        transferAccounts[k].status = 1;
                        transferAccounts[k].pay_date = payDate;
                        await transferAccounts[k].save();
                    }
                    console.log(5555555555555)
                    console.log("转账时间:", new Date().format('yyyy-MM-dd hh:mm:ss'));
                    console.log("当前微信转账记录0||tenantId:" + tenantId + " consignee:" + consignee + " merchantAmount:" + merchantAmount);
                }else{
                    return -1
                }
            } catch (e) {
                console.log(e);
            }
        }
    },

    async reimburse(ctx,next){
        ctx.checkBody('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        await this.mounthTransferAccounts(body.tenantId)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async queryTransferInfo(ctx, next) {
        var params = {
            partner_trade_no: '1497504255624'
        }

        const fn = co.wrap(wxpay.queryTransferInfo.bind(wxpay))

        const result = await fn(params)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }
}