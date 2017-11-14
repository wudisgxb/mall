const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')

const Tool = require('../../Tool/tool')
const db = require('../../db/mysql/index')
const SupplierManage = db.models.SupplierManage

module.exports = {
    async saveSupplierManage (ctx, next) {
        ctx.checkBody("name").notBlank()
        ctx.checkBody("supplierProperty").notBlank()
        ctx.checkBody("phone").notBlank()
        ctx.checkBody("principal").notBlank()
        ctx.checkBody("principalPhone").notBlank()
        ctx.checkBody("tenantId").notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body

        let goodNumber = (Math.random()*8999+1000)+""+new Date().getTime()
        let createJson = {
            name :body.name,
            supplierProperty :body.supplierProperty,
            phone :body.phone,
            principal :body.principal,
            principalPhone :body.principalPhone,
            tenantId :body.tenantId,
            supplierNumber : goodNumber
        }
        try{
            await SupplierManage.save(createJson)
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,{
            supplierNumber : goodNumber
        })
    },
    async updateSupplierManage (ctx, next) {
        ctx.checkBody("/supplier/name",true).first().notBlank()
        ctx.checkBody("/supplier/supplierProperty",true).first().notBlank()
        ctx.checkBody("/supplier/phone",true).first().notBlank()
        ctx.checkBody("/supplier/principal",true).first().notBlank()
        ctx.checkBody("/supplier/principalPhone",true).first().notBlank()
        ctx.checkBody('/condition/tenantId', true).first().notBlank();
        ctx.checkBody('/condition/id', true).first().notBlank();
        ctx.checkBody('/condition/supplierNumber', true).first().notBlank();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body


        let updateJson = {
            name :body.supplier.name,
            supplierProperty :body.supplier.supplierProperty,
            phone :body.supplier.phone,
            principal :body.supplier.principal,
            principalPhone :body.supplier.principalPhone
        }
        let whereJson = {
            tenantId : body.condition.tenantId,
            id : body.condition.id,
            supplierNumber : body.condition.supplierNumber,
        }
        try{
            let supplierManage = await SupplierManage.findOne({
                where:whereJson
            })
            if(supplierManage==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没找到此供应商")
                return
            }
            await SupplierManage.update(updateJson,{where:whereJson})
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getSupplierManageByTenantId (ctx, next) {
        ctx.checkQuery("tenantId").notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            tenantId : ctx.query.tenantId
        }
        let supplierManages
        try{
            supplierManages = await SupplierManage.findAll(whereJson)
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,supplierManages)
    },
    async getSupplierManageById (ctx, next) {
        ctx.checkQuery("tenantId").notBlank()
        ctx.checkQuery("supplierNumber").notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            tenantId : ctx.query.tenantId,
            supplierNumber : ctx.query.supplierNumber
        }
        let supplierManages
        try{
            supplierManages = await SupplierManage.findOne(whereJson)
            if(supplierManages==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有找到需要删除的供应商")
                return
            }
            await supplierManages.destroy()
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async deleteSupplierManage (ctx, next) {
        ctx.checkQuery("tenantId").notBlank()
        ctx.checkQuery("supplierNumber").notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            tenantId : ctx.query.tenantId,
            supplierNumber : ctx.query.supplierNumber
        }
        let supplierManages
        try{
            supplierManages = await SupplierManage.findAll(whereJson)
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,supplierManages)
    },
}