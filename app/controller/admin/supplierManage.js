const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')

const Tool = require('../../Tool/tool')
const db = require('../../db/mysql/index')
const SupplierManages = db.models.SupplierManages

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

        let goodNumber = Math.floor(Math.random()*8999+1000)+""+new Date().getTime()

        try{
            let createJson = {
                name :body.name,
                supplierProperty :body.supplierProperty==null?"":body.supplierProperty,
                phone :body.phone==null?"":body.phone,
                principal :body.principal==null?"":body.principal,
                principalPhone :body.principalPhone==null?"":body.principalPhone,
                tenantId :body.tenantId,
                supplierNumber : goodNumber
            }
            await SupplierManages.create(createJson)
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
            let supplierManage = await SupplierManages.findOne({
                where:whereJson
            })
            if(supplierManage==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没找到此供应商")
                return
            }
            await SupplierManages.update(updateJson,{where:whereJson})
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
            supplierManages = await SupplierManages.findAll({
                where:whereJson
            })
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
            console.log(ctx.query.tenantId)
            console.log(ctx.query.supplierNumber)
            supplierManages = await SupplierManages.findOne({
                where:whereJson
            })
            if(supplierManages==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有找到需要删除的供应商")
                return
            }
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR,e)
            return
        }
        let supplierManagesArray = []
        supplierManagesArray.push(supplierManages)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,supplierManages)
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
            supplierManages = await SupplierManages.findOne({where:whereJson})
            if(supplierManages==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"您删除的数据不存在")
                return
            }
            await supplierManages.destroy()
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,supplierManages)
    },
}