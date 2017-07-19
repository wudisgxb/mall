const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let getFoodEchats = require('../echats/foodsEchats')
let db = require('../../db/mysql/index');
module.exports = {
    async savefoodEchats(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR);
        }
        let result = await getFoodEchats.getfEchats(body.tenantId,body.startTime,body.type);
        if(result.length==0){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR,"找不到数据");
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,result);
    },
    async savefoodsEchats(ctx,next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('startTime').notEmpty();
        ctx.checkBody('endTime').notEmpty();
        ctx.checkBody('type').notEmpty();
        let body = ctx.request.body
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.DB_ERROR);
        }
        if(body.type==1){
            let orders = [];
            let array = [];
            let startDate= new Date(body.startTime)
            startDate.getTime()
            let endDate = new Date(body.endTime);
            endDate.getTime();
            let jsonfood={}
            let order;
            let endstartDate = endDate-startDate;
            let endStartTime = endstartDate/86400000
            for (let i = 0; i < endStartTime; i++) {
                orders = await Orders.findAll({
                    where:{
                        createdAt:{
                            $gte:startDate.setHours(0,0,0),
                            $lt:startDate.setHours(23,59,59)
                        },
                        tenantId:tenantId
                    }
                })
                if(orders.length==0){
                    ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有数据")
                    break;
                }
                for(let j=0;j<orders.length;j++){
                    if(!array.contains(orders[j].FoodId)){
                        array.push(orders[j].FoodId)
                    }
                }
                for(let k = 0;k<array.length;k++ ){
                    let num = await Orders.sum('num', {
                        where: {
                            FoodId: id,
                            createdAt: {
                                $lt: startDate,
                                $gte: startDate
                            }
                        },
                        paranoid: false
                    })
                    result.push({
                        time: new Date(i).format("yyyy-MM-dd"),
                        num: num
                    })
                }
            }
        }
    }

}
