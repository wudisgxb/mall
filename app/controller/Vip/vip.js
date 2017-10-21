const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Vip = db.models.Vips;
let VipIntegrals = db.models.VipIntegrals
let AllianceMerchants = db.models.AllianceMerchants
let vipss = require('../admin/vip')
//链接数据库


module.exports = {
    //会员注册
    async saveAdminVip (ctx, next) {
        ctx.checkBody('/vip/phone', true).first().notEmpty();//电话
        ctx.checkBody('/vip/referral', true).first().notEmpty();//推荐人
        ctx.checkBody('/vip/referralPhone', true).first().notEmpty();//推荐人电话
        ctx.checkBody('/vip/birthday', true).first().notEmpty();//生日
        ctx.checkBody('/vip/name', true).first().notEmpty();//名字
        ctx.checkBody('/vip/membershipCardNumber', true).first().notEmpty();//卡号
        ctx.checkBody('tenantId').notEmpty()
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return;
        }
        let allianceMerchants = await AllianceMerchants.findOne({
            where:{
                tenantId: body.tenantId
            }
        })
        if(allianceMerchants==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "此租户不在商圈下")
            return;
        }
        let vips = await Vip.findAll({
            where: {
                phone: body.vip.phone,
                alliancesId:allianceMerchants.alliancesId
                // tenantId: body.tenantId
            }
        })
        if (vips.length > 0) {
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "此商圈下会员已存在")
            return;
        }
        let vipsNum = await Vip.findAll({
            where: {
                membershipCardNumber: body.vip.membershipCardNumber,
                alliancesId:allianceMerchants.alliancesId
                // tenantId: body.tenantId
            }
        })
        if(vipsNum>0){
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "此商圈下卡号已存在")
            return;
        }

        if(body.vip.referralPhone!=""&&body.vip.referralPhone!=null){
            let vip = await Vip.findOne({
                where:{
                    alliancesId:allianceMerchants.alliancesId,
                    phone : body.vip.referralPhone,
                }
            })
            if(vip==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此推荐人的电话")
            }
            let aggregateScore = Number(vip.aggregateScore)+5
            await Vip.update({
                aggregateScore : aggregateScore
            },{
                where:{
                    alliancesId:vip.alliancesId,
                    phone : vip.phone
                }
            })
        }
        if(body.vip.referral!=""&&body.vip.referral!=null){
            let vip = await Vip.findOne({
                where:{
                    alliancesId:allianceMerchants.alliancesId,
                    name : body.vip.referral,
                }
            })
            if(vip==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此推荐人的电话")
            }
            let aggregateScore = Number(vip.aggregateScore)+5
            await Vip.update({
                aggregateScore : aggregateScore
            },{
                where:{
                    alliancesId:vip.alliancesId,
                    phone : vip.phone
                }
            })
        }
        await Vip.create({
            phone: body.vip.phone,
            vipLevel: 0,
            tenantId: body.tenantId,
            alliancesId : allianceMerchants.alliancesId,
            birthday :body.vip.birthday,
            name :body.vip.name,
            membershipCardNumber :body.vip.membershipCardNumber,
            referralPhone :body.vip.referralPhone,
            referral :body.vip.referral,
            aggregateScore : 10
            // todo: ok?
            //deletedAt: Date.now()

        });
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },
    //会员修改记录
    async updateAdminVipById (ctx, next) {
        ctx.checkBody('/condition/alliancesId', true).first().notEmpty();
        ctx.checkBody('/vip/birthday', true).first().notEmpty();
        ctx.checkBody('/vip/name', true).first().notEmpty();
        ctx.checkBody('/vip/phone', true).first().notEmpty();
        ctx.checkBody('/vip/referral', true).first().notEmpty();
        ctx.checkBody('/vip/referralPhone', true).first().notEmpty();
        let body = ctx.request.body;
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors);
            return;
        }
        let vips = await Vip.findOne({
            where: {
                phone: body.condition.phone,
                tenantId: body.condition.alliancesId
            }
        })
        if(vips==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"此上去啊下没找到该会员信息，请先注册")
            return
        }
        if (vips != null) {
            vips.phone = body.vip.phone;
            vips.birthday = body.vip.birthday;
            vips.name = body.vip.name;
            vips.referral = body.vip.referral;
            vips.referralPhone = body.vip.referralPhone;
            // vips.tenantId = body.condition.tenantId;
            vips.id = body.condition.id;
            await vips.save();

        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

    },
    //查询此租户下会员的开户信息
    async getAdminVip (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();

        if (ctx.errors) {
            new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors);
            return;
        }
        let pageNumber = parseInt(ctx.query.pageNumber);

        if(pageNumber<1){
            pageNumber=1
        }

        let pageSize = parseInt(ctx.query.pageSize);
        if(pageNumber<1){
            pageNumber=1
        }
        let place = (pageNumber - 1) * pageSize;
        //每页显示的大小
        let vips
        if((ctx.query.pageSize!=null||ctx.query.pageSize!="")&&(ctx.query.pageNumber!=null||ctx.query.pageNumber!="")){
            vips = await Vip.findAll({
                where: {
                    tenantId: ctx.query.tenantId
                },
                offset: place,
                limit: pageSize
            });
        }else if(ctx.query.pageSize==null&&ctx.query.pageNumber==null){

            vips = await Vip.findAll({
                where: {
                    tenantId: ctx.query.tenantId
                }
            });
        }

        if (vips.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此vip");
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, vips);
    },

    //删除会员信息
    async deleteAdminVip(ctx, next){

        ctx.checkQuery('id').notEmpty().isInt().toInt();
        ctx.checkQuery('tenantId').notEmpty();

        let vip = await Vip.findOne({
            where: {
                id: ctx.query.id,
                tenantId: ctx.query.tenantId
            }
        });
        if (vip == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此vip记录");
        }
        await vip.destroy();
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS);
    },

    //根据卡号或者电话号码查询此商圈下有没有此人
    async getAdminVipPhone(ctx, next){
        ctx.checkQuery('alliancesId').notEmpty
        ctx.checkQuery('number').notEmpty
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let vip = await Vip.findAll({
            where: {
                alliancesId: ctx.query.alliancesId,
                $or:[{
                        phone : ctx.query.number
                    },
                    {
                        membershipCardNumber : ctx.query.number
                    }]
            }
        });
        if(vip.length==0){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"查无此人")
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,vip)
    },
    //修改卡号/修改商圈Id
    async updateVipmem(ctx,next){

        let vips = await Vip.findAll({paranoid: false})

        let ArrayNumber = []
        let y = 1
        for(let i =0;i<vips.length;i++){


            ArrayNumber.push(Vip.update({
                membershipCardNumber :y,
                alliancesId :"222267370d07487ee160a1b7c07136e4"
            },{
                where:{
                    id : vips[i].id
                }
            }))
            y++

        }
        await ArrayNumber
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }

}
