const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
const stockManage = require('../WareHouseManage/stockManage')
const Tool = require('../../Tool/tool')

module.exports = {
    async saveStockManage (ctx, next) {
        ctx.checkBody("goodName").notBlank()
        ctx.checkBody("property").notBlank()
        ctx.checkBody("specification").notBlank()
        ctx.checkBody("unit").notBlank()
        ctx.checkBody("constPrice").notBlank()
        ctx.checkBody("goodNum").notBlank()
        ctx.checkBody("tenantId").notBlank()
        ctx.checkBody("paymentMethod").notBlank()
        ctx.checkBody("goodStatus").notBlank()
        ctx.checkBody("realPrice").notBlank()
        ctx.checkBody("restPrice").notBlank()
        ctx.checkBody("couponPrice").notBlank()
        ctx.checkBody("stockTime").notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body

        let goodNumber = (Math.random()*8999+1000)+""+new Date().getTime()
        let createJson = {
            goodName :body.goodName,
            property :body.property,
            specification :body.specification,
            unit :body.unit,
            constPrice :body.constPrice,
            goodNum :body.goodNum,
            goodNumber : goodNumber,
            info : body.info==null?"":body.info,
            tenantId :body.tenantId,
            paymentMethod :body.paymentMethod,
            goodStatus :body.goodStatus,
            stockTime :body.stockTime,
            totalPrice :body.goodNum*body.constPrice,
            realPrice :body.realPrice,
            restPrice :body.restPrice,//其他金额
            couponPrice : body.couponPrice,
        }
        try{
            await stockManage.saveStockGoods(createJson)
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async updateStockManage (ctx, next) {
        ctx.checkBody('id').notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        let keys = ['name', 'property', 'specification', 'unit', 'paymentMethod'];
        const condition = await keys.reduce((accu, curr) => {
            if (ctx[curr]) {
                accu[curr] = body.condition[curr]
            }
            return accu;
        }, {})
        let whereJson = {
            id : body.id
        }
        try{
            await stockManage.updateStockGoods(condition,whereJson)
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.UPDATE_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    async getStockManageOne (ctx, next) {
        // ctx.checkQuery('tenantId').notBlank()
        let keys = ['name', 'property', 'unit', 'goodsNumber','tenantId'];
        const condition = keys.reduce((accu, curr) => {
            if (ctx.query[curr]) {
                accu[curr] = ctx.query[curr]
            }
            return accu;
        }, {})

        let pageNumber = parseInt(ctx.query.pageNumber);

        if(pageNumber<1){
            pageNumber=1
        }

        let pageSize = parseInt(ctx.query.pageSize);
        if(pageSize<1){
            pageSize=1
        }
        let place = (pageNumber - 1) * pageSize;

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        if(condition.name!=null){
            condition.name = {
                $like : "%"+condition.name+"%"
            }
        }
        if(condition.goodsNumber!=null){
            condition.goodsNumber = {
                $like : "%"+condition.goodsNumber+"%"
            }
        }
        if(condition.property!=null){
            condition.property = {
                $like : "%"+condition.property+"%"
            }
        }

        condition.tenantId = ctx.query.tenantId
        let stock
        let limitJson ={}
        if(ctx.query.pageSize!=null&&ctx.query.pageSize!=""&&ctx.query.pageNumber!=null&&ctx.query.pageNumber!=""){
            limitJson = {
                offset: Number(place),
                limit: Number(pageSize)
            }
        }

        // try{
            console.log(limitJson)
            stock = await stockManage.getStockGoods(condition,limitJson)
            if(stock==null){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此进货记录")
                return
            }
        // }catch (e){
        //     ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,e)
        //     return
        // }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,stock)
    },
    // async getStockManagesBytime (ctx, next) {
    //
    //     ctx.checkQuery('tenantId').notBlank()
    //     ctx.checkQuery('startTime').notBlank()
    //     ctx.checkQuery('endTime').notBlank()
    //     if(ctx.errors){
    //         ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
    //         return
    //     }
    //     let whereJson = {
    //         stockTime : {
    //             $gte : ctx.query.startTime,
    //             $lt : ctx.query.endTime
    //         },
    //         tenantId : ctx.query.tenantId
    //     }
    //     let stocks = []
    //     try{
    //         stocks = await stockManage.getStockGoods(whereJson)
    //         if(stocks.length==0){
    //             ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此进货记录")
    //             return
    //         }
    //     }catch (e){
    //         ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,e)
    //         return
    //     }
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS,stocks)
    //
    // },
    async getStockManagesByGoodSum (ctx, next) {
        ctx.checkQuery('tenantId').notBlank()
        // ctx.checkQuery('goodNumber').notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            tenantId : ctx.query.tenantId,
            goodNumber : ctx.query.goodNumber,
        }
        let pageNum = "pageNum"
        let stocks = []
        try{
            stocks = await stockManage.getStockGoodsSum(pageNum,whereJson)
            if(stocks.length==0){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此进货数量")
                return
            }
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,e)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,stocks)
    },
    async getStockManagesByTenantId (ctx, next) {
        ctx.checkQuery('tenantId').notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            tenantId : ctx.query.tenantId
        }
        let limitJson={}
        let stocks = []
        if(ctx.query.pageSize!=null&&ctx.query.pageSize!=""&&ctx.query.pageNumber!=null&&ctx.query.pageNumber!=""){
            let pageNumber = parseInt(ctx.query.pageNumber);
            let pageSize = parseInt(ctx.query.pageSize);
            let place = (pageNumber - 1) * pageSize;
            limitJson.place = place
            limitJson.pageSize = pageSize
            try{
                stocks = await stockManage.getStockGoods(whereJson,limitJson)
                if(stocks.length==0){
                    ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此进货记录")
                    return
                }
            }catch (e){
                ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,e)
                return
            }
        }
        if(ctx.query.pageSize==""||ctx.query.pageSize==""||ctx.query.pageNumber==null||ctx.query.pageNumber==""){
            try{
                stocks = await stockManage.getStockGoods(whereJson)
                if(stocks.length==0){
                    ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此进货记录")
                    return
                }
            }catch (e){
                ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,e)
                return
            }
        }


        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,stocks)

    },
    async getStockManagesByTenantIdCount (ctx, next) {
        ctx.checkQuery('tenantId').notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let whereJson = {
            tenantId : ctx.query.tenantId
        }
        let stocks
        try{
            stocks = await stockManage.getStockGoodsCount(whereJson)
            if(stocks.length==0){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有此进货记录")
                return
            }
        }catch (e){
            ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR,e)
            return
        }



        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,stocks)

    },
}