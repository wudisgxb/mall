const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Vip = db.models.Vips;
let VipIntegrals = db.models.VipIntegrals
let Merchants = db.models.Merchants
let Alliances = db.models.Alliances
let Customers = db.models.Customers
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
        // ctx.checkBody('/vip/name', true).first().notEmpty();//名字
        // ctx.checkBody('/vip/membershipCardNumber', true).first().notEmpty();//卡号
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
            ctx.body = new ApiResult(ApiResult.Result.EXISTED, "此商圈下此会员已存在")
            return;
        }
        if(body.vip.membershipCardNumber!=null&&body.vip.membershipCardNumber!=""){
            let vipsNum = await Vip.findAll({
                where: {
                    membershipCardNumber: body.vip.membershipCardNumber,
                    alliancesId:allianceMerchants.alliancesId
                    // tenantId: body.tenantId
                }
            })
            if(vipsNum>0){
                ctx.body = new ApiResult(ApiResult.Result.EXISTED, "此商圈下此卡号已存在")
                return;
            }
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
                return
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
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此推荐人名字")
                return
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
            membershipCardNumber :body.vip.membershipCardNumber==null?"":body.vip.membershipCardNumber,
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
        ctx.checkBody('/condition/phone', true).first().notEmpty();
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
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没找到该会员信息，请先注册")
            return
        }
        if (vips != null) {
            vips.phone = body.condition.phone;
            vips.birthday = body.vip.birthday;
            vips.name = body.vip.name;
            vips.referral = body.vip.referral;
            vips.referralPhone = body.vip.referralPhone;
            // vips.tenantId = body.condition.tenantId;
            vips.alliancesId = body.condition.alliancesId;
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
        if((ctx.query.pageSize!=null&&ctx.query.pageSize!="")&&(ctx.query.pageNumber!=null&&ctx.query.pageNumber!="")){
            vips = await Vip.findAll({
                where: {
                    tenantId: ctx.query.tenantId
                },
                offset: Number(place),
                limit: Number(pageSize)
            });
        }else if(ctx.query.pageNumber==null||ctx.query.pageSize==null||ctx.query.pageNumber==""||ctx.query.pageSize==""){

            vips = await Vip.findAll({
                where: {
                    tenantId: ctx.query.tenantId
                }
            });
        }

        if (vips.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此vip");
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, vips);
    },

    async getAdminVipCount (ctx, next) {
        ctx.checkQuery('tenantId').notEmpty();

        if (ctx.errors) {
            new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors);
            return;
        }

        //每页显示的大小
        let vips


        vips = await Vip.findAll({
            where: {
                tenantId: ctx.query.tenantId
            }
        });


        if (vips.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此vip");
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS, vips.length);
    },

    //删除会员信息
    async deleteAdminVip(ctx, next){

        ctx.checkQuery('id').notEmpty().isInt().toInt();
        // ctx.checkQuery('tenantId').notEmpty();

        let vip = await Vip.findOne({
            where: {
                id: ctx.query.id
            }
        });
        if (vip == null) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此vip记录");
            return
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
    },

    async getAdminVipsFind(allianceId){
        console.log(allianceId)
        let alliance = await Alliances.findAll({
            where:{
                alliancesId : allianceId
            }
        })
        console.log(alliance)
        if(alliance.length==0){
            return 0
        }
        return 1
    },

    // async getAdminVipCount (ctx, next) {
    //     ctx.checkQuery('tenantId').notEmpty();
    //     ctx.checkQuery('alliancesId').notEmpty();
    //     if (ctx.errors) {
    //         new ApiResult(ApiResult.Result.DB_ERROR, ctx.errors);
    //         return;
    //     }
    //     let alliancesId = ctx.query.alliancesId
    //     let find = await this.getAdminVipsFind(alliancesId)
    //     console.log(find)
    //     if(find==0){
    //         ctx.body = new ApiResult(ApiResult.Result.EXISTED,"查询不到此商圈")
    //         return
    //     }
    //     let vipsCount
    //     if(ctx.query.tenantId!=null&&ctx.query.alliancesId==null) {
    //         // let tenantIdOrAlliancesId = await tenantIdOrAlliancesId(ctx.query.tenantId,ctx.query.alliancesId)
    //         // if(tenantIdOrAlliancesId==1){
    //             vipsCount = await Vip.count({
    //                 where: {
    //                     tenantId: ctx.query.tenantId
    //                 }
    //             });
    //         // }else{
    //         //     return tenantIdOrAlliancesId
    //         // }
    //     }
    //     if(ctx.query.tenantId!=null&&ctx.query.alliancesId!=null){
    //         // let tenantIdOrAlliancesId = await tenantIdOrAlliancesId(ctx.query.tenantId,ctx.query.alliancesId)
    //         // if(tenantIdOrAlliancesId==1){
    //             vipsCount = await Vip.count({
    //                 where: {
    //                     tenantId: ctx.query.tenantId,
    //                     alliancesId : ctx.query.alliancesId
    //                 }
    //             });
    //         // }else{
    //         //     return tenantIdOrAlliancesId
    //         // }
    //
    //     }
    //     if(ctx.query.alliancesId!=null&&ctx.query.tenantId==null){
    //         // let tenantIdOrAlliancesId = await tenantIdOrAlliancesId(ctx.query.tenantId,ctx.query.alliancesId)
    //         // if(tenantIdOrAlliancesId==1){
    //             vipsCount = await Vip.count({
    //                 where: {
    //                     alliancesId: ctx.query.alliancesId
    //                 }
    //             });
    //         // }else{
    //         //     return tenantIdOrAlliancesId
    //         // }
    //
    //     }
    //
    //
    //     // if (vips.length == 0) {
    //     //     ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "没有此vip");
    //     // }
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS, vipsCount);
    // },

    async fonds(ctx,next){
        ctx.checkBody('tenantId').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let customers = await Customers.findAll({
            where:{
                tenantId : ctx.request.body.tenantId
            }
        })

        let a = []
        customers.forEach(function (e) {
            a.push(e.phone)
        })
        let c = a.filter(function (element,index,self) {
            return self.indexOf(element)===index
        })
        this.bbbb(c)
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,c)

    }
}

// let tenantIdOrAlliancesId = async function (tenantId,alliancesId){
//
//     if(tenantId!=null&&alliancesId==null) {
//         let merchant = await Merchants.findOne({
//             where:{
//                 where:{
//                     tenantId :tenantId
//                 }
//             }
//         })
//         if(merchant==null){
//             return "找不到这个租户"
//         }
//     }
//     if(tenantId!=null&&alliancesId!=null){
//         let alliance = await Alliances.findOne({
//             where:{
//                 alliancesId : alliancesId
//             }
//         })
//         if(alliance==null){
//             return "找不到这个商圈"
//         }
//         let merchant = await Merchants.findOne({
//             where:{
//                 where:{
//                     tenantId :tenantId
//                 }
//             }
//         })
//         if(merchant==null){
//             return "找不到这个租户"
//         }
//
//     }
//     if(alliancesId!=null&&tenantId==null){
//         let alliance = await Alliances.findOne({
//             where:{
//                 alliancesId : ctx.query.alliancesId
//             }
//         })
//         if(alliance==null){
//             return "找不到这个商圈"
//         }
//     }
//     return 1
// }


