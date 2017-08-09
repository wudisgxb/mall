// const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
// const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let Foods = db.models.Foods;

let getFoodNum = require('../../controller/statistics/statistics');

module.exports = {
    async saveHostSaleFood(ctx, next){
        ctx.checkBody('tenantId').notEmpty();
        ctx.checkBody('num').notEmpty();
        let body = ctx.request.body
        let results=[];
        let result;

        let resultId;
        result = await getFoodNum.getFood(body.tenantId,body.num);
        if(result.length==0){
            ctx.body=new ApiResult(ApiResult.Result.NOT_FOUND,"上个月没有热销数据")
            return;
        }
        if(result.length<body.num){
            body.num=result.length;
        }

        resultId = result.sort((a, b)=>b.num - a.num);
        for (let k = 0; k < body.num; k++) {
            results.push(resultId[k])
        }
        let foods;
        // console.log(results)
        for(let i=0;i<results.length;i++){
            foods = await Foods.findById(results[i].id)
            results[i].name = foods.name;
            results[i].image=foods.image;
            results[i].taste=foods.taste;
            results[i].rating=foods.rating;
            results[i].type=foods.type;
            results[i].price=foods.price;
            results[i].nfo=foods.info;
        }
        ctx.body=new ApiResult(ApiResult.Result.SUCCESS,results)
    }

}


