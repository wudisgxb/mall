const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const db = require('../../db/mysql/index');
const Headquarters = db.models.Headquarters;
const Tool = require('../../Tool/tool');
const sqlAllianceHeadquarters = require('../businessAlliance/allianceHeadquarters')
const sqlAllianceMerchants = require('../businessAlliance/allianceMerchants')
const sqlAlliances = require('../businessAlliance/alliances')
const sqlHeadquarters = require('../businessAlliance/headquarters')
const headQuarters = require('../businessAlliance/headquarters')
const AllianceMerchants = db.models.AllianceMerchants;
const Foods = db.models.Foods



module.exports = {
    async saveAllianceHeadquarters(ctx,next){
        ctx.checkBody('alliancesId').notEmpty()
        ctx.checkBody('headquartersId').notEmpty()
        // ctx.checkBody('alliancesRemark').notEmpty()
        // ctx.checkBody('headquartersRemark').notEmpty()
        // ctx.checkBody('allianceRate').notEmpty()
        // ctx.checkBody('headquartersRate').notEmpty()
        // ctx.checkBody('alliancesName').notEmpty()
        // ctx.checkBody('headquartersName').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let whereJson = {
            alliancesId : body.alliancesId,
            headquartersId : body.headquartersId
        }
        let allianceHeadquarters = await sqlAllianceHeadquarters.getAllianceHeadquarters(whereJson);
        let alliances = await sqlAlliances.getAlliances({alliancesId : whereJson.alliancesId})
        if(alliances==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到当前商户联盟")
            return
        }
        let headquarters = await sqlHeadquarters.getHeadquarter({headquartersId : whereJson.headquartersId})
        if(headquarters==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到当前总部")
            return
        }
        if(allianceHeadquarters!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"已经有当前配置信息了")
            return
        }
        // if(Number(body.allianceRate)+Number(body.headquartersRate)!=1){
        //     ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,"分润比例不合理")
        //     return
        // }

        let createJson = {
            alliancesId : body.alliancesId,
            headquartersId : body.headquartersId,
            alliancesRemark :alliances.name+"商圈",
            headquartersRemark :headquarters.name+"平台",
            // allianceRate : body.allianceRate,
            // headquartersRate : body.headquartersRate,
            alliancesName : alliances.name,
            headquartersName : headquarters.name,
        }
        // await Headquarters.create(createJson)
        await sqlAllianceHeadquarters.createAllianceHeadquarters(createJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async updateAllianceHeadquarters(ctx,next){
        ctx.checkBody('id').notEmpty()
        ctx.checkBody('alliancesId').notEmpty()
        ctx.checkBody('headquartersId').notEmpty()
        // ctx.checkBody('alliancesRemark').notEmpty()
        // ctx.checkBody('headquartersRemark').notEmpty()
        // ctx.checkBody('allianceRate').notEmpty
        // ctx.checkBody('headquartersRate').notEmpty
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let body = ctx.request.body;
        let whereJson = {
            id : body.id
        }
        let allianceHeadquarters = await sqlAllianceHeadquarters.getAllianceHeadquarters(whereJson);
        if(allianceHeadquarters==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没找到当前配置信息")
            return
        }
        // if(Number(body.allianceRate)+Number(body.headquartersRate)!=1){
        //     ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,"分润比例不合理")
        //     return
        // }
        let updateJson = {
            alliancesId : body.alliancesId,
            headquartersId : body.headquartersId,
            // alliancesRemark : body.alliancesRemark,
            // headquartersRemark :body.headquartersRemark,
        }
        await sqlAllianceHeadquarters.updateAllianceHeadquarters(updateJson,whereJson);
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async deleteAllianceHeadquarters(ctx,next){
        ctx.checkQuery('alliancesId').notEmpty()
        ctx.checkQuery('headquartersId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            alliancesId : ctx.query.alliancesId,
            headquartersId : ctx.query.headquartersId
        }
        let allianceHeadquarters = await sqlAllianceHeadquarters.getAllianceHeadquarters(whereJson);
        console.log(allianceHeadquarters)
        if(allianceHeadquarters==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个配置")
            return
        }

        await sqlAllianceHeadquarters.deleteAllianceHeadquarters(whereJson)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getAllianceHeadquarters(ctx,next){
        ctx.checkQuery('alliancesId').notEmpty()
        // ctx.checkQuery('headquartersId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            alliancesId : ctx.query.alliancesId,
            // headquartersId : ctx.query.headquartersId
        }
        let allianceHeadquarters = await sqlAllianceHeadquarters.getAllianceHeadquarters(whereJson);
        if(allianceHeadquarters==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个商圈Id")
            return
        }
        let headquarter = await headQuarters.getHeadquarter({headquartersId :allianceHeadquarters.headquartersId});
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,headquarter)
    },
    async getAllianceHeadquartersByheadquartersId(ctx,next){
        ctx.checkQuery('headquartersId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return;
        }
        let whereJson = {
            headquartersId : ctx.query.headquartersId
        }
        let allianceHeadquarters = await sqlAllianceHeadquarters.getAllianceHeadquarterAll(whereJson);
        if(allianceHeadquarters==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到这个商圈Id")
            return
        }
        let alliancesArray = []
        for(let i = 0; i < allianceHeadquarters.length; i++){
            let jsonAlliances = {
                alliancesId :allianceHeadquarters[i].alliancesId
            }
            let alliances = await sqlAlliances.getAlliances(jsonAlliances)
            alliancesArray.push(alliances)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,alliancesArray)
    },
    async getMerchant(ctx,next){
        ctx.checkQuery('headquartersId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            headquartersId : ctx.query.headquartersId
        }
        let allianceHeadquarters = await sqlAllianceHeadquarters.getAllianceHeadquarters(whereJson);
        if(allianceHeadquarters.length==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有当前记录")
            return
        }
        let merchantArray = []
        for(let i = 0 ; i < allianceHeadquarters.length ; i++){
            let alliances = allianceHeadquarters[i].alliancesId
            let jsonAllianceMerchants ={
                alliances : alliances
            }
            let allianceMerchants = await sqlAllianceMerchants.getOperations(jsonAllianceMerchants)
            for(let j = 0 ; j < allianceMerchants.length ; j++){
                let tenantId = allianceMerchants[i].tenantId
                let merchant = await Merchant.findOne({
                    where:{
                        tenantId : tenantId
                    }
                })
                merchantArray.push(merchant)
            }

        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,merchantArray)
    },
}
