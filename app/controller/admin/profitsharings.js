const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
const Tool = require('../../Tool/tool');
let Profitsharings =  db.models.ProfitSharings;
let Consignee = db.models.Consignees;
let Merchant = db.models.Merchants;
let consignee = db.models.Consignees;



module.exports = {
    //根据TenantId查询所有代售点信息
    async getAdminProfitsharingsByTenantId(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors );
            return;
        }

        let profitsharing = await Profitsharings.findAll({
            where:{
                tenantId:ctx.query.tenantId
            }
        });
        if(profitsharing==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"未找到信息");
            return;
        }
        //console.log(profitsharing[0].consigneeId);
        let consignee=[];
        for(let i=0;i<profitsharing.length;i++) {
            consigneeId = await Consignee.findAll({
                where:{
                    consigneeId:profitsharing[i].consigneeId
                }
            })
            consignee.push(consigneeId[i].name)
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,consignee);
    },

    async saveAdminProfitsharings(ctx,next){
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('consigneeName').notEmpty()
        // ctx.checkBody('merchantRemark').notEmpty()
        // ctx.checkBody('consigneeRemark').notEmpty()
        ctx.checkBody('phone').notEmpty()
        ctx.checkBody('wecharPayee_account').notEmpty()
        ctx.checkBody('payee_account').notEmpty()
        ctx.checkBody('rate').notEmpty()
        //ctx.checkBody('ownRate').notEmpty()
        // ctx.checkBody('distributionFee').notEmpty()
        ctx.checkBody('excludeFoodId').notEmpty()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body;
        let profitsharings = await Profitsharings.findOne({
            where: {
                tenantId: body.tenantId,
                consigneeName: body.consigneeName,
            }
        })
        if (profitsharings != null) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "已有此分润记录");
            return;
        }

        let merchant = await Merchant.findOne({
            where:{
                tenantId:body.tenantId
            }
        })
        if(body.rate>1){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,"代售商分成比例不可以超过1")
            return;
        }
        let excludeFoodId = JSON.stringify(body.excludeFoodId);
        let consigneeId = Tool.allocTenantId()
        await Profitsharings.create({
            tenantId : body.tenantId,
            consigneeName : body.consigneeName,
            consigneeId : consigneeId,
            merchantRemark :merchant.name+"代售-转账",
            consigneeRemark : body.consigneeName+"代收分润",
            rate : body.rate,
            ownRate : 0.1,
            excludeFoodId  : excludeFoodId
        })
        await consignee.create({
             tenantId : body.tenantId,
             name : body.consigneeName,
             phone : body.phone,
             wecharPayee_account : body.wecharPayee_account,
             payee_account : body.payee_account,
             consigneeId : consigneeId
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,consigneeId)
        // ctx.checkBody('tenantId').notEmpty()
        // ctx.checkBody('consigneeId').notEmpty()
        //
        // ctx.checkBody('rate').notEmpty()
        // ctx.checkBody('ownRate').notEmpty()
        // ctx.checkBody('distributionFee').notEmpty()
        // ctx.checkBody('excludeFoodId').notEmpty()
        // if (ctx.errors) {
        //     ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
        //     return;
        // }
        // let body = ctx.request.body;
        // let profitsharings = await Profitsharings.findOne({
        //     where: {
        //         tenantId: body.tenantId,
        //         consigneeId: body.consigneeId,
        //     }
        // })
        // if (profitsharings != null) {
        //     ctx.body = new ApiResult(ApiResult.Result.EXISTED, "已有此分润记录");
        //     return;
        // }
        // let merchant = await Merchant.findOne({
        //     where:{
        //         tenantId:body.tenantId
        //     }
        // })
        // if(merchant==null){
        //     ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此租户信息");
        //     return;
        // }
        //
        // let excludeFoodId = JSON.stringify(body.excludeFoodId);
        // await Profitsharings.create({
        //     tenantId:body.tenantId,
        //     consigneeId:body.consigneeId,
        //     merchantRemark:merchant.name+"代售-转账",
        //     consigneeRemark:consignee.name+"-代售分润",
        //     rate:body.rate,
        //     ownRate:body.ownRate,
        //     distributionFee:body.distributionFee,
        //     excludeFoodId:excludeFoodId
        // })
        // ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async updateAdminProfitsharings(ctx,next){
        ctx.checkBody('tenantId').notEmpty()
        ctx.checkBody('consigneeId').notEmpty()
        ctx.checkBody('/profitsharings/consigneeName',true).first().notEmpty()
        ctx.checkBody('/profitsharings/rate',true).first().notEmpty()
        ctx.checkBody('/profitsharings/ownRate',true).first().notEmpty()
        ctx.checkBody('/profitsharings/excludeFoodId',true).first().notEmpty()

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body;
        let profitsharings = await Profitsharings.findOne({
            where: {
                tenantId: body.tenantId,
                consigneeId: body.consigneeId,
            }
        })
        if(profitsharings==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此记录")
            return
        }

        let excludeFoodId = JSON.stringify(body.profitsharings.excludeFoodId)

        if(profitsharings!=null){
            profitsharings.rate = Number(body.profitsharings.rate).toFixed(2)
            profitsharings.ownRate = Number(body.profitsharings.ownRate).toFixed(2)
            profitsharings.consigneeName = body.profitsharings.consigneeName
            profitsharings.excludeFoodId = excludeFoodId
            profitsharings.tenantId = body.tenantId
            profitsharings.consigneeId = body.consigneeId
            await profitsharings.save();
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async deleteAdminProfitsharings(ctx,next){
        ctx.checkQuery('tenantId').notEmpty();
        ctx.checkQuery('consigneeId').notEmpty();
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors)
            return;
        }
        let profitsharings = await Profitsharings.findOne({
            where: {
                tenantId: ctx.query.tenantId,
                consigneeId: ctx.query.consigneeId
            }
        })
        if (profitsharings == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此分润信息")
            return;
        }
        await profitsharings.destroy()
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }

}
