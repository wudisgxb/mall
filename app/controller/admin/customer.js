const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Tool = require('../../Tool/tool')
let customerSql = require('./customer/customer')
let Customers = db.models.Customers

module.exports = {

    async getCustomerByCount(ctx,next){

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors);
            return;
        }
        let jsonCustomer={}
        if(ctx.query.tenantId!=null&&ctx.query.phone!=null){
            jsonCustomer = {
                tenantId : ctx.query.tenantId,
                phone : ctx.query.phone
            }
        }else if(ctx.query.tenantId!=null&&ctx.query.phone==null){
            jsonCustomer = {
                tenantId : ctx.query.tenantId
            }
        }else if(ctx.query.tenantId==null&&ctx.query.phone!=null){
            jsonCustomer = {
                phone : ctx.query.phone
            }
        }
        let customer = await customerSql.getCount(jsonCustomer)
        console.log(customer)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,customer)
    },
    async getCustomerBytenantId (ctx, next) {
        ctx.checkBody('tenantId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let limitJson ={}
        let body= ctx.request.body
        if(body.pageNumber != null){
            //页码
            let pageNumber = parseInt(body.pageNumber);
            //每页显示的大小
            let pageSize = parseInt(body.pageSize);
            let place = (pageNumber-1)*pageSize;
            limitJson={
                limit : pageSize,
                offset : place
            }
        }
        let jsonCustomer = {
            tenantId : body.tenantId
        }
        let customer = await customerSql.getcustomer(jsonCustomer,limitJson)
        console.log(customer)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,customer)
    },

    async getCustomerByPhone (ctx, next) {
        ctx.checkBody('phone').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body= ctx.request.body
        let limitJson ={}
        if(body.pageNumber != null){
            //页码
            let pageNumber = parseInt(body.pageNumber);
            //每页显示的大小
            let pageSize = parseInt(body.pageSize);
            let place = (pageNumber-1)*pageSize;
            limitJson={
                limit : pageSize,
                offset : place
            }
        }
        let jsonCustomer = {
            phone : body.phone
        }
        let customer = await customerSql.getcustomer(jsonCustomer,limitJson)
        console.log(customer)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,customer)
    },

    async updateCustomerBytenantId (ctx, next) {
        ctx.checkBody('/customers/phone',true).first().notEmpty()
        ctx.checkBody('/customers/status',true).first().notEmpty()
        ctx.checkBody('/customers/isVip',true).first().notEmpty()
        ctx.checkBody('/customers/totalPrice',true).first().notEmpty()
        ctx.checkBody('/customers/foodName',true).first().notEmpty()
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('id').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body= ctx.request.body
        let jsonCustomer = {
            phone : body.customers.phone,
            status : body.customers.status,
            isVip : body.customers.isVip,
            totalPrice : body.customers.totalPrice,
            foodName : JSON.stringify(body.customers.foodName),
        }
        let whereJson ={
            id : body.id,
            tenantId : body.tenantId
        }
        let customer = JSON.stringify(await customerSql.getCustomerOne(whereJson))
        console.log(customer)
        await Customers.update(jsonCustomer,{
            where:whereJson
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async saveCustomerBytenantId (ctx, next) {
        ctx.checkBody('/customers/phone',true).first().notEmpty()
        ctx.checkBody('/customers/status',true).first().notEmpty()
        ctx.checkBody('/customers/totalPrice',true).first().notEmpty()
        ctx.checkBody('/customers/foodName',true).first().notEmpty()
        ctx.checkBody('/customers/tenantId',true).first().notEmpty()
        ctx.checkBody('/customers/isVip',true).first().notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body= ctx.request.body
        let jsonCustomer = {
            phone : body.customers.phone,
            status : body.customers.status,
            totalPrice : body.customers.totalPrice,
            foodName : JSON.stringify(body.customers.foodName),
            tenantId : body.customers.tenantId,
            isVip : body.customers.isVip
        }
        await customerSql.savecustomer(jsonCustomer)

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async deleteCustomerBytenantId (ctx, next) {
        ctx.checkQuery('id').notEmpty()
        ctx.checkQuery('tenantId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson ={
            tenantId : ctx.query.tenantId,
            id : ctx.query.id
        }
        let customer = await customerSql.getCustomerOne(whereJson)
        if(customer!=null){
            await customer.destroy();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },


}
