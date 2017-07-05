const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
var util = require('util');


const Tables = db.models.Tables;
const Foods = db.models.Foods;
const Menus = db.models.Menus;
const Foodsofmenus = db.models.FoodsOfTMenus;
const Ratings = db.models.Ratings;
const ProfitSharings = db.models.ProfitSharings;


module.exports = {
    async getUserDealAlipayReq (ctx, next) {
        ctx.checkQuery('amount').notEmpty().isFloat().toFloat();
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('tableName').notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        //获取tableId
        let table = await Tables.findOne({
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

        var amount = ctx.query.amount;


        //代售商户,利润分成
        var consignee = ctx.query.consignee || "";
        console.log("tenantId:" + ctx.query.tenantId);

        //查找主商户名称
        var alipayConfigs = await AlipayConfigs.findAll({
            where:{
                tenantId:ctx.query.tenantId
            }
        });
        //查找桌名
        var tableName = table.name;

        var merchant = alipayConfigs[0].merchant;

        var outTradeId = Date.now().toString();
        var new_params = ali.webPay({
            subject: merchant + '-' + tableName + '账单',
            body: '消费',
            outTradeId: outTradeId,
            timeout: '10m',
            amount: amount,
            goodsType: '1'
            //sellerId: '2088102132737080'
        });

        console.log(decodeURIComponent(new_params));

        var app_id_tmp = decodeURIComponent(new_params).split('&')[0];
        var app_id = app_id_tmp.substring(app_id_tmp.indexOf('=') + 1,app_id_tmp.length);

        var biz_content = decodeURIComponent(new_params).split('&')[1];
        var biz_json = JSON.parse(biz_content.substring(biz_content.indexOf('=') + 1,biz_content.length));

        var trade_no = biz_json.out_trade_no;
        var total_amount = biz_json.total_amount;


        //判断是否再次生成params
        //tableId and order状态不等于1-待支付状态（order满足一个就行）
        //且未超时失效

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
                paymentMethod:'支付宝',
                isFinish : false,
                isInvalid : false
            }
        });

        if(foodOrders.length >0 && paymentReqs.length >0) {
            //判断是否失效 10min
            if((Date.now() - paymentReqs[0].createdAt.getTime()) > 10*60*1000) {
                paymentReqs[0].isInvalid = true;
                await paymentReqs[0].save();

                await PaymentReqs.create({
                    params:new_params,
                    tableId: tableId,
                    paymentMethod:'支付宝',
                    isFinish: false,
                    isInvalid : false,
                    trade_no:trade_no,
                    app_id:app_id,
                    total_amount:total_amount,
                    consignee:consignee,
                    TransferAccountIsFinish:false,
                    consigneeTransferAccountIsFinish:false,
                    tenantId:ctx.query.tenantId
                });

                for (var i = 0 ; i < foodOrders.length;i++) {
                    foodOrders[i].trade_no = trade_no;
                    foodOrders[i].paymentMethod = '支付宝';
                    await foodOrders[i].save();
                }

                ctx.body ={
                    params:new_params
                }
            } else {
                ctx.body ={
                    params:paymentReqs[0].params
                }
            }
        } else {
            await PaymentReqs.create({
                params:new_params,
                tableId: tableId,
                paymentMethod:'支付宝',
                isFinish: false,
                isInvalid : false,
                trade_no:trade_no,
                app_id:app_id,
                total_amount:total_amount,
                actual_amount:total_amount,
                refund_amount:'0',
                refund_reason:'',
                consignee:consignee,
                TransferAccountIsFinish:false,
                consigneeTransferAccountIsFinish:false,
                tenantId:ctx.query.tenantId
            });

            foodOrders = await FoodOrders.findAll({
                where: {
                    TableId: tableId,
                    // status:0//未支付
                    $or: [{status : 0}, {status : 1}] ,
                }
            })

            for (var i = 0 ; i < foodOrders.length;i++) {
                foodOrders[i].status = 1;//待支付
                foodOrders[i].trade_no = trade_no;
                foodOrders[i].paymentMethod = '支付宝';
                await foodOrders[i].save();
            }

            ctx.body ={
                params:new_params
            }
        }

    },


}