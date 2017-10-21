const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let customerSql = require('./customer/customer')
let Customers = db.models.Customers
let NewOrders = db.models.NewOrders
let OrderGoods = db.models.OrderGoods
let Vips = db.models.Vips
let Merchants = db.models.Merchants

module.exports = {

    async getCustomersPhoneBytenantId(ctx,next){
        ctx.checkQuery("tenantId").notEmpty()
        ctx.checkQuery("status").notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let whereJson = {
            tenantId : ctx.query.tenantId,
            status : ctx.query.status,
        }
        let customer = await customerSql.getCustomer(whereJson)
        if(customer.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此租戶下的人數")
            return;
        }
        let customerArray = []
        for(let i = 0; i < customer.length; i++){
            if(!customerArray.contains(customer[i].phone)){
                customerArray.push(customer[i].phone)
            }
        }
        
        let phoneArray = []
        let phoneJson = {}
        for(let j = 0; j < customerArray.length; j++){
            phoneJson ={
                phone : customerArray[j]
            }
        }
        phoneArray.push(phoneJson,customerArray.length)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,phoneArray)
    },

    async getCustomerByAll(ctx,next){
        ctx.checkQuery("tenantId").notEmpty()
        ctx.checkQuery("status").notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let whereJson = {
            tenantId : ctx.query.tenantId,
            status : ctx.query.status,
        }
        let customer = await customerSql.getCustomer(whereJson)
        if(customer.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此租戶下的人數")
            return;
        }
        let customerArray = []
        for(let i = 0; i < customer.length; i++){
            let merchant = await Merchants.findOne({
                where : {
                    tenantId : customer[i].tenantId
                }
            })
            let customerJson = {
                id : customer[i].id,
                phone : customer[i].phone,
                tenantId : customer[i].tenantId,
                status : customer[i].status,
                isVip : customer[i].isVip,
                totalPrice : customer[i].totalPrice,
                foodName : customer[i].foodName,
                tenantName : Merchants==null?null:Merchants.name,
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,customer)
    },

    async updateCustomerAll(ctx, next){
        let newOrders = await NewOrders.findAll({})
        let arrayCustomers = []

        for(let i = 0; i < newOrders.length; i++){
            let totalPrice=0
            let orderGoods = await OrderGoods.findAll({
                where:{
                    trade_no : newOrders[i].trade_no
                }
            })

            let arrayGoodsName=[]

            for(let j = 0; j<orderGoods.length;j++){

                totalPrice += orderGoods[j].num * orderGoods[j].price
                for(let g = 0; g < orderGoods[j].num; g++){
                    arrayGoodsName.push(orderGoods[j].goodsName)
                }
            }
            let vip = await Vips.findOne({
                where:{
                    phone : newOrders[i].phone,
                    tenantId : newOrders[i].tenantId,
                }
            })

            for(let k = 0; k <= newOrders[i].status; k++){
                let whereJson = {
                    phone : newOrders[i].phone,
                    tenantId : newOrders[i].tenantId,
                    status : newOrders[i].status+1-k,
                    isVip : vip==null?false:true,
                    totalPrice : totalPrice,
                    foodName : JSON.stringify(arrayGoodsName)
                }
                arrayCustomers.push(customerSql.saveCustomer(whereJson))
            }

            Promise.all(arrayCustomers);
        }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getCustomerByCount(ctx, next){
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let jsonCustomer = {}
        if (ctx.query.tenantId != null && ctx.query.phone != null) {
            jsonCustomer = {
                tenantId: ctx.query.tenantId,
                phone: ctx.query.phone
            }
        } else if (ctx.query.tenantId != null && ctx.query.phone == null) {
            jsonCustomer = {
                tenantId: ctx.query.tenantId
            }
        } else if (ctx.query.tenantId == null && ctx.query.phone != null) {
            jsonCustomer = {
                phone: ctx.query.phone
            }
        }
        let customer = await customerSql.getCount(jsonCustomer)
        // console.log(customer)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, customer)
    },

    async getCustomerBytenantId (ctx, next) {
        ctx.checkBody('tenantId').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let limitJson = {}
        let body = ctx.request.body
        if (body.pageNumber != null) {
            //页码
            let pageNumber = parseInt(body.pageNumber);
            //每页显示的大小
            let pageSize = parseInt(body.pageSize);
            let place = (pageNumber - 1) * pageSize;
            limitJson = {
                limit: pageSize,
                offset: place
            }
        }
        let jsonCustomer = {
            tenantId: body.tenantId
        }
        let customer = await customerSql.getCustomer(jsonCustomer, limitJson)
        // console.log(customer)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, customer)
    },

    async getCustomerByPhone (ctx, next) {
        ctx.checkBody('phone').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body
        let limitJson = {}
        if (body.pageNumber != null) {
            //页码
            let pageNumber = parseInt(body.pageNumber);
            //每页显示的大小
            let pageSize = parseInt(body.pageSize);
            let place = (pageNumber - 1) * pageSize;
            limitJson = {
                limit: pageSize,
                offset: place
            }
        }
        let jsonCustomer = {
            phone: body.phone
        }
        let customer = await customerSql.getCustomer(jsonCustomer, limitJson)
        // console.log(customer)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, customer)
    },

    async updateCustomerBytenantId (ctx, next) {
        ctx.checkBody('/customers/phone', true).first().notEmpty()
        ctx.checkBody('/customers/status', true).first().notEmpty()
        ctx.checkBody('/customers/isVip', true).first().notEmpty()
        ctx.checkBody('/customers/totalPrice', true).first().notEmpty()
        ctx.checkBody('/customers/foodName', true).first().notEmpty()
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('id').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body
        let jsonCustomer = {
            phone: body.customers.phone,
            status: body.customers.status,
            isVip: body.customers.isVip,
            totalPrice: body.customers.totalPrice,
            foodName: JSON.stringify(body.customers.foodName),
        }
        let whereJson = {
            id: body.id,
            tenantId: body.tenantId
        }
        let customer = JSON.stringify(await customerSql.getCustomerOne(whereJson))
        // console.log(customer)
        await Customers.update(jsonCustomer, {
            where: whereJson
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async saveCustomerBytenantId (ctx, next) {
        ctx.checkBody('/customers/phone', true).first().notEmpty()
        ctx.checkBody('/customers/status', true).first().notEmpty()
        ctx.checkBody('/customers/totalPrice', true).first().notEmpty()
        ctx.checkBody('/customers/foodName', true).first().notEmpty()
        ctx.checkBody('/customers/tenantId', true).first().notEmpty()
        ctx.checkBody('/customers/isVip', true).first().notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let body = ctx.request.body
        let jsonCustomer = {
            phone: body.customers.phone,
            status: body.customers.status,
            totalPrice: body.customers.totalPrice,
            foodName: JSON.stringify(body.customers.foodName),
            tenantId: body.customers.tenantId,
            isVip: body.customers.isVip
        }
        await customerSql.saveCustomer(jsonCustomer)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async deleteCustomerBytenantId (ctx, next) {
        ctx.checkQuery('id').notEmpty()
        ctx.checkQuery('tenantId').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }

        let whereJson = {
            tenantId: ctx.query.tenantId,
            id: ctx.query.id,
            // createdAt : {
            //     $gte:new Date("2017-09-01 00:00:00"),
            //     $lt : new Date("2017-09-02 00:00:00")
            // }
        }
        let customer = await customerSql.getCustomer(whereJson)
        console.log(customer.length)
        if (customer.length>0) {
            for(let c of customer){
                await c.destroy();
            }
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },


}
