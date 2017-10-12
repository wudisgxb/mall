const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const db = require('../../db/mysql/index')
const Tool = require('../../Tool/tool')
const VipIntegrals = db.models.VipIntegrals
const Vips = db.models.Vips
const Foods = db.models.Foods
const Tables = db.models.Tables
const NewOrders = db.models.NewOrders
const OrderGoods = db.models.OrderGoods
const HeadquartersIntegrals = db.models.HeadquartersIntegrals
const AllianceHeadquarters = db.models.AllianceHeadquarters
const Headquarters = db.models.Headquarters

module.exports = {

    async saveConversionIntegral(ctx,next){
        ctx.checkBody('phone').notEmpty()//会员电话
        ctx.checkBody('goods').notEmpty()//获得物品信息（包含物品的id，name,价格）
        // ctx.checkBody('integral').notEmpty()//失去积分
        ctx.checkBody('tenantId').notEmpty()//商品对应的租户
        ctx.checkBody('alliancesId').notEmpty()//会员对应的联盟Id
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        let vip = await Vips.findOne({
            where:{
                phone : body.phone,
                alliancesId : alliancesId
            }
        })
        if(vip==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此会员")
            return
        }

        let allianceHeadquarter = await AllianceHeadquarters.findOne({
            where:{
                alliancesId:vip.alliancesId
            }
        })
        console.log(allianceHeadquarter)
        let food = await Foods.findOne({
            where:{
                id : body.goods.id
            }
        })
        //查询food中可兑换的总数量
        if(food==null){
            ctx.body= new ApiResult(ApiResult.Result.NOT_FOUND,"查询不到此物品")
            return
        }
        if(Number(food.conversionNum)==0){
            ctx.body= new ApiResult(ApiResult.Result.NOT_FOUND,"当前商品可兑换数量为0，请选择其他商品")
            return
        }
        //查找到桌号
        let table = await Tables.findOne({
            where:{
                name : "0号桌",
                tenantId : food.tenantId,
                // consigneeId:null
            }
        })
        if(table==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"该租户没有桌子")
            return
        }



        //生成trade_no
        let date = new Date().getTime()
        let random = Math.random() * 8999 + 1000
        let trade_no = date+""+random
        await NewOrders.create({
            status : 0,
            info : body.goods.info==null?"":body.goods.info,
            phone : body.phone,
            diners_num : body.goods.num,
            trade_no : trade_no,
            consigneeId : null,
            tenantId : food.tenantId,
            TableId : table.id,
            bizType : "ipay"
        })
        await OrderGoods.create({
            num : 1,
            unit : "份",
            trade_no : trade_no,
            consigneeId: null,
            tenantId : food.tenantId,
            FoodId : food.id,
            goodsName : food.name,
            price : 0,
            vipPrice : 0,
            activityPrice : -1,
            purchaseLimit : -1,
            integral :food.integral
        })

        // let date = new Date().getTime();
        // // console.log(date.toString().length)
        // let tool = Tool.allocTenantId().substring(17)
        // let vipIntegralsId = "heaV"+date+tool
        // await VipIntegrals.create({
        //     vipIntegralsId:vipIntegralsId,
        //     vipId:vip.id,
        //     buyOrSale : 0,
        //     buyOrSaleMerchant :allianceHeadquarter.headquartersId,
        //     price:0,
        //     integral :body.integral
        // })
        //
        // let aggregateScoreVip = vip.aggregateScore-body.integral
        // await Vips.update({
        //     aggregateScore :aggregateScoreVip
        // },{
        //     where:{
        //         phone : body.phone
        //     }
        // })
        //
        // let headquartersIntegralsId = "Viph"+Tool.allocTenantId()
        // await HeadquartersIntegrals.create({
        //     headquartersIntegralsId:headquartersIntegralsId,
        //     headquartersId :allianceHeadquarter.headquartersId,
        //     buyOrSale : 1,
        //     buyOrSaleMerchant :vip.id,
        //     price:0,
        //     integral :body.integral
        // })
        // let headquarters = await Headquarters.findOne({
        //     where:{
        //         headquartersId : allianceHeadquarter.headquartersId,
        //     }
        // })
        // let aggregateScoreHead = headquarters.aggregateScore+body.integral
        // await Headquarters.update({
        //     aggregateScore:aggregateScoreHead
        // },{
        //     where:{
        //         headquartersId : allianceHeadquarter.headquartersId
        //     }
        // })
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }
}
