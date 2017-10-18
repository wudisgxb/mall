const HeadquartersIntegrals = db.models.HeadquartersIntegrals
const AllianceHeadquarters = db.models.AllianceHeadquarters
const Headquarters = db.models.Headquarters

module.exports = {
    async saveConversionIntegral(ctx,next){
        ctx.checkBody('phone').notEmpty()//会员电话
        ctx.checkBody('goods').notEmpty()//获得物品
        ctx.checkBody('integral').notEmpty()//失去积分
        ctx.checkBody('alliancesId').notEmpty()//商圈ID
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        let vip = await Vips.findOne({
            where:{
                phone : body.phone,
                alliancesId : body.alliancesId
            }
        })
        if(vip==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"此商圈下没有此会员")
            return
        }
        if(vip.aggregateScore<body.integral){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"您的积分太少")
            return
        }
        //查询商圈对应的平台
        let allianceHeadquarter = await AllianceHeadquarters.findOne({
            where:{
                alliancesId:vip.alliancesId
            }
        })
        console.log(allianceHeadquarter)
        let date = new Date().getTime();
        // console.log(date.toString().length)
        let tool = Tool.allocTenantId().substring(17)
        let vipIntegralsId = "heaV"+date+tool
        //记录vip积分中
        await VipIntegrals.create({
            vipIntegralsId:vipIntegralsId,
            vipId:vip.id,
            buyOrSale : 0,
            buyOrSaleMerchant :allianceHeadquarter.headquartersId,
            price:0,
            integral :body.integral
        })

        let aggregateScoreVip = vip.aggregateScore-body.integral
        //修改Vip积分
        await Vips.update({
            aggregateScore :aggregateScoreVip
        },{
            where:{
                phone : body.phone,
                alliancesId : body.alliancesId
            }
        })

        let headquartersIntegralsId = "Viph"+Tool.allocTenantId()
        //商圈获得的积分记录到商圈积分记录表中
        await HeadquartersIntegrals.create({
            headquartersIntegralsId:headquartersIntegralsId,
            headquartersId :allianceHeadquarter.headquartersId,
            buyOrSale : 1,
            buyOrSaleMerchant :vip.id,
            price:0,
            integral :body.integral
        })
        //查询平台积分信息
        let headquarters = await Headquarters.findOne({
            where:{
                headquartersId : allianceHeadquarter.headquartersId,
            }
        })

        let aggregateScoreHead = headquarters.aggregateScore+body.integral
        //修改平台积分
        await Headquarters.update({
            aggregateScore:aggregateScoreHead
        },{
            where:{
                headquartersId : allianceHeadquarter.headquartersId
            }
        })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }
}
