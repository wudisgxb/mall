const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let Consignees = db.models.Consignees
let ProfitSharings=db.models.ProfitSharings
const Tool = require('../../Tool/tool');

module.exports = {
    async getAdminConsignees(ctx,next){
        ctx.checkQuery('consigneeId').notEmpty()
        if (ctx.errors) {
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,ctx.errors);
            return;
        }
        let consignees = await Consignees.findAll({
           where : {
               consigneeId:ctx.query.consigneeId
            }
        });
        if(consignees.length==0){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"查询不到此数据");
            return;
        }
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS,consignees);
    },

    async updateAdminConsignees(ctx,next){
        ctx.checkBody('/consignees/name',true).first().notEmpty();
        ctx.checkBody('/consignees/phone',true).first().notEmpty();
        ctx.checkBody('/consignees/wecharPayee_account',true).first().notEmpty();
        ctx.checkBody('/consignees/payee_account',true).first().notEmpty();
        ctx.checkBody('/condition/consigneeId',true).first().notEmpty();
        ctx.checkBody('/condition/id',true).first().notEmpty();
        if (this.errors) {
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,this.errors);
            return;
        }
        let body = ctx.request.body;
        let consignees = await Consignees.findOne({
            where : {
                id:body.condition.id
            }
        });
        if(consignees==null){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"没有此数据");
            return;
        }
        consignees.name=body.consignees.name;
        consignees.phone=body.consignees.phone;
        consignees.wecharPayee_account=body.consignees.wecharPayee_account;
        consignees.payee_account=body.consignees.payee_account;
        consignees.consigneeId=body.consignees.consigneeId;
        await consignees.save();
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS);
    },
    
    async saveAdminConsignees(ctx,next){
        ctx.checkBody('/consignees/name',true).first().notEmpty();
        ctx.checkBody('/consignees/phone',true).first().notEmpty();
        ctx.checkBody('/consignees/wecharPayee_account',true).first().notEmpty();
        ctx.checkBody('/consignees/payee_account',true).first().notEmpty();

        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors);
            return;
        }
        let body = ctx.request.body;

        let consigneeByName = await Consignees.findOne({
            where:{
                name:body.consignees.name
            }
        })
        if(consigneeByName!=null){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED,"已有此代售名字，请换个名字")
            return;
        }
        let consigneeId =  Tool.allocTenantId();
        await Consignees.create({
                name : body.consignees.name,
                phone : body.consignees.phone,
                wecharPayee_account : body.consignees.wecharPayee_account,
                payee_account : body.consignees.payee_account,
                consigneeId : consigneeId
        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,{consigneeId:consigneeId})
    },

    async deleteAdminConsignees(ctx,next){
        ctx.checkQuery('id').notEmpty();
        // ctx.checkQuery('consigneeId').notEmpty();
        if (this.errors) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, this.errors);
            return;
        }
        let consignees = await Consignees.findOne({
            where:{
                id:ctx.query.id
                //consigneeId:ctx.query.consigneeId
            }
        })
        if(consignees==null){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, "没有此代售点");
            return;
        }
        await consignees.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    async getAllConsignees(ctx,next){
        let consignees = await Consignees.findAll({});
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS,consignees);
    },

}