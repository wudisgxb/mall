const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const OrderGoods = db.models.OrderGoods
const Tool = require('../../Tool/tool')
let TenantInfo = db.models.TenantConfigs;
const Consignees = db.models.Consignees;
const Merchants = db.models.Merchants;
const amountManager = require('../amount/amountManager')

module.exports = {

    async getTenantInfoByTenantId (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }

        let tenantInfo = await TenantInfo.findOne({
            where: {
                tenantId: ctx.query.tenantId,
            }
        })

        let result = {};
        if (tenantInfo != null) {
            let merchant = await Merchants.findOne({
                where: {
                    tenantId: ctx.query.tenantId,
                }
            })
            result.name = tenantInfo.name;
            result.payee_account = tenantInfo.payee_account;
            result.wecharPayee_account = tenantInfo.wecharPayee_account;
            result.needVip = tenantInfo.needVip;
            result.vipFee = tenantInfo.vipFee;
            result.vipRemindFee = tenantInfo.vipRemindFee;
            result.homeImage = tenantInfo.homeImage;
            result.isRealTime = tenantInfo.isRealTime;
            result.invaildTime = tenantInfo.invaildTime;
            result.longitude = tenantInfo.longitude;
            result.latitude = tenantInfo.latitude;
            result.phone = merchant.phone;
            result.address = merchant.address;
            result.needChoosePeopleNumberPage = tenantInfo.needChoosePeopleNumberPage;
            result.openFlag = tenantInfo.openFlag;
            result.officialNews = tenantInfo.officialNews;
            result.firstDiscount = tenantInfo.firstDiscount;
            result.startTime = tenantInfo.startTime;
            result.outOfServiceTimePrompt = tenantInfo.outOfServiceTimePrompt;
            result.endTime = tenantInfo.endTime;
            result.deliveryStartTime = tenantInfo.deliveryStartTime;
            result.deliveryEndTime = tenantInfo.deliveryEndTime;
            result.needChoosePayMode = JSON.parse(tenantInfo.needChoosePayMode);
            // result.qrCodeType = merchant.qrCodeType;
            let tenantInfoArray = []
            tenantInfoArray.push(result)
            ctx.body = new ApiResult(ApiResult.Result.SUCCESS, tenantInfoArray);
        } else {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, '没有该租户的基本信息！');
        }
    },

    //新增租户信息
    async saveTenantInfo(ctx, next){
        ctx.checkBody('/tenantConfig/name', true).first().notEmpty();
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('/tenantConfig/wecharPayee_account', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/payee_account', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/isRealTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipFee', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/vipRemindFee', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/homeImage', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/startTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/endTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/deliveryStartTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/deliveryEndTime', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/needChoosePayMode', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/needVip', true).first().notEmpty();
        // ctx.checkBody('/tenantConfig/qrCodeType', true).first().notEmpty();

        ctx.checkBody('/tenantConfig/longitude', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/latitude', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/officialNews', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/needChoosePeopleNumberPage', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/openFlag', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/firstDiscount', true).first().notEmpty();
        ctx.checkBody('/tenantConfig/invaildTime', true).first().notEmpty();

        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let tenantInfo = await TenantInfo.findAll({
            where: {
                tenantId: body.tenantId
            }
        })
        if (tenantInfo.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "已有租户信息");
            return;
        }

        await TenantInfo.create({
            name: body.tenantConfig.name,
            wecharPayee_account: body.tenantConfig.wecharPayee_account,
            payee_account: body.tenantConfig.payee_account,
            isRealTime: body.tenantConfig.isRealTime,
            needVip: body.tenantConfig.needVip,
            vipFee: body.tenantConfig.vipFee,
            vipRemindFee: body.tenantConfig.vipRemindFee,
            homeImage: body.tenantConfig.homeImage,
            startTime: body.tenantConfig.startTime,
            endTime: body.tenantConfig.endTime,
            deliveryStartTime : body.tenantConfig.deliveryStartTime,
            deliveryEndTime : body.tenantConfig.deliveryEndTime,
            needChoosePayMode : body.tenantConfig.needChoosePayMode,
            outOfServiceTimePrompt : body.tenantConfig.outOfServiceTimePrompt,
            // qrCodeType : body.tenantConfig.qrCodeType,
            tenantId: body.tenantId,
            longitude: body.tenantConfig.longitude,
            latitude: body.tenantConfig.latitude,
            officialNews: body.tenantConfig.officialNews,
            needChoosePeopleNumberPage: JSON.stringify(body.tenantConfig.needChoosePeopleNumberPage),
            openFlag: body.tenantConfig.openFlag,
            firstDiscount: body.tenantConfig.firstDiscount,
            invaildTime: body.tenantConfig.invaildTime,
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    //编辑租户信息
    async updateTenantInfoByTenantId(ctx, next){
        ctx.checkBody('/condition/tenantId', true).first().notEmpty();
        let keys = ['wecharPayee_account', 'payee_account', 'isRealTime', 'vipFee', 'vipRemindFee',
            'homeImage', 'startTime', 'name','endTime','needVip','longitude','address','phone','latitude',
            'officialNews','needChoosePeopleNumberPage','openFlag','firstDiscount','invaildTime','deliveryStartTime',
            'deliveryEndTime','needChoosePayMode','outOfServiceTimePrompt'];
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        const condition = keys.reduce((accu, curr) => {
            if (body.tenantConfig[curr]!=null) {
                accu[curr] = body.tenantConfig[curr]
            }
            return accu;
        }, {})
        if(condition.name!=null){
            await Merchants.update({
                name : condition.name
            }, {
                where:{
                    tenantId : body.condition.tenantId
                }
            })
            await Consignees.update({
                name : condition.name
            },{ where:{
                tenantId : body.condition.tenantId
            }})
            console.log(condition)
        }
        console.log(condition)
        if(condition.address!=null){
            await Merchants.update({
                address : condition.address
            }, {
                where:{
                    tenantId : body.condition.tenantId
                }
            })
            await delete condition.address
        }
        console.log(condition)
        if(condition.phone!=null){
            await Merchants.update({
                phone : condition.phone
            }, {
                where:{
                    tenantId : body.condition.tenantId
                }
            })
            await delete condition.phone
        }
        if(condition.needChoosePayMode!=null){
            if(!Tool.isArray(condition.needChoosePayMode)){
                let needChoosePayMode = []
                needChoosePayMode.push(condition.needChoosePayMode)
                condition.needChoosePayMode = JSON.stringify(needChoosePayMode)
            }else{
                condition.needChoosePayMode = JSON.stringify(condition.needChoosePayMode)
            }
            console.log(condition)
        }
        // console.log(condition)
        await TenantInfo.update(condition,{
            where:{
                tenantId : body.condition.tenantId
            }
        })

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    //查询账单信息
    async getTenantInfoByBill(ctx,next){
        ctx.checkQuery('tenantId').notEmpty()
        // ctx.checkQuery('trade_no').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR.errors)
            return
        }
        let ordersJson = await amountManager.getBill(ctx.query.tenantId)


        // let ordersJson = {}
        // let totalPrice = 0
        // let saleGoodsTotalPrices = 0
        // let profitPrice = 0
        // let merchantTotalPrice = 0
        // let terracePrice = 0
        // let orderArray = []
        //
        // let order = await amountManager.getNewOrder(ctx.query.tenantId)
        // let staticDate = new Date().getTime()
        //
        // const promises = Array.from({length:200}, (_) => createPromise())
        // await Promise.all(promises)
        //
        // function createPromise(){
        //     return new Promise((res, rej) => {
        //         setTimeout(() => {
        //             res('done')
        //         },3e2)
        //     })
        // }
        //
        // // for(let i = 0; i < 200; i++){
        //
        //     // let orderJson = {}
        //     // let orderGoods = await createPromise();
        //     // totalPrice += orderGoods.totalPrices
        //     // saleGoodsTotalPrices += orderGoods.saleGoodsTotalPrices
        //     // profitPrice += orderGoods.profitPrice
        //     // merchantTotalPrice += orderGoods.merchantTotalPrice
        //     // terracePrice += orderGoods.terracePrice
        //     // // orderJson.phone = order[i].phone
        //     // // orderJson.status = order[i].status
        //     // orderJson.orderGoods = orderGoods
        //     // orderArray.push(orderJson)
        // // }
        // let endDate = new Date().getTime()
        // console.log(endDate-staticDate)
        // // ordersJson.totalPrice = totalPrice
        // // ordersJson.saleGoodsTotalPrices = saleGoodsTotalPrices
        // // ordersJson.profitPrice = profitPrice
        // // ordersJson.merchantTotalPrice = merchantTotalPrice
        // // ordersJson.terracePrice = terracePrice
        // // // ordersJson.orderArray = orderArray
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,ordersJson)

    },

    //
    async saveorderGood(ctx,next){
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        for(let i =0;i<200;i++){
            let date = new Date().getTime()
            await OrderGoods.create({
                num : 1,
                unit : "袋",
                trade_no : date,
                consigneeId : "07e15af0db11ddb1919c5c1376f4e2c7",
                tenantId : "33333ce0f7e31d8b92c4472a8ad3eeb3",
                FoodId : 1095,
                price : 2,
                vipPrice :2,
                activityPrice : -1,
                purchaseLimit : -1,
                constPrice : 1
            })
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }

}
