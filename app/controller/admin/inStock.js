// const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
// const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let InStocks = db.models.InStocks;
let GoodsInfos = db.models.GoodsInfos
let WareHouseManages = db.models.WareHouseManages
let StockOrderBatchs = db.models.StockOrderBatchs
let SupplierManage = db.models.SupplierManage
let Tool = require('../../Tool/tool')

let getFoodNum = require('../../controller/statistics/statistics');

module.exports = {

    async saveInStock(ctx,next){
        ctx.checkBody('pageNumber').notBlank()
        // ctx.checkBody('goodsNumber').notBlank()
        // ctx.checkBody('property').notBlank()
        ctx.checkBody('num').notBlank()
        // ctx.checkBody('unit').notBlank()
        // ctx.checkBody('unitPrice').notBlank()
        ctx.checkBody('personInCharge').notEmpty()
        // ctx.checkBody('time').notBlank()
        // ctx.checkBody('info').notBlank()
        // ctx.checkBody('totalPrice').notBlank()
        // ctx.checkBody('goodsStatus').notBlank()
        ctx.checkBody('tenantId').notBlank()
        // ctx.checkBody('inStock').notBlank()

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        let goodInfo = await GoodsInfos.findAll({
            where:{
                tenantId : body.tenantId,
                pageNumber : body.pageNumber
            }
        })
        if(goodInfo==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有商品的记录")
            return
        }

        await InStocks.create({
            name : goodInfo.name,
            goodsNumber : goodInfo.goodsNumber,
            property : goodInfo.property,
            num : body.num,
            // supplierNumber : body.supplierNumber,
            unit : goodInfo.unit,
            personInCharge : body.personInCharge!=null?body.personInCharge:"",
            time : new Date(),
            info : body.info!=null?body.info:"",
            unitPrice : goodInfo.unitPrice,
            // totalPrice : Number(body.num)*Number(goodInfo.unitPrice),
            goodsStatus : 0,
            tenantId : goodInfo.tenantId
        })
        // console.log(InStocks)
        // let inStock = body.inStock
        // if(inStock.length>0){
        //     let batchMax = await InStocks.max("batch",{
        //         where:{
        //             tenantId :inStock[0].tenantId
        //         }
        //     })
        //
        //     for(let i = 0; i < inStock.length; i++){
        //         let goodsNumber = await GoodsInfos.findOne({
        //             where:{
        //                 tenantId : inStock[i].tenantId,
        //                 name : inStock[i].name,
        //             }
        //         })
        //         await InStocks.create({
        //             name :inStock[i].name,
        //             property :inStock[i].property,
        //             num :inStock[i].num,
        //             unit :inStock[i].unit,
        //             goodsNumber : goodsNumber,
        //             unitPrice :inStock[i].unitPrice,
        //             personInCharge :inStock[i].personInCharge,
        //             time : new Date(),
        //             info : inStock[i].info!=null?inStock[i].info:"",
        //             totalPrice :inStock[i].num*inStock[i].unitPrice,
        //             goodsStatus :0,
        //             batch : batchMax+1,
        //             tenantId :inStock[i].tenantId,
        //         })
        //     }
        //
        // }else{
        //     ctx.body = new ApiResult(ApiResult.Result.CREATE_ERROR)
        //     return
        // }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)

    },

    async saveInStockPatch(ctx,next) {
        ctx.checkBody('instock').notBlank()
        ctx.checkBody('tenantId').notBlank()
        ctx.checkBody('supplierId').notBlank()
        ctx.checkBody('info').notEmpty()
        ctx.checkBody('discountsPrice').notBlank()
        ctx.checkBody('restPrice').notBlank()
        ctx.checkBody('alreadyPaymentPrice').notBlank()
        if (ctx.errors) {
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR, ctx.errors)
            return
        }
        let body = ctx.request.body
        if (body.instock.length == 0) {
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "商品信息不能为空");
            return
        }
        let instockArray = []
        let totalPrices = 0
        let patch = new Date().getTime()
        for (let i = 0; i < body.instock.length; i++) {
            let instock = body.instock[i]
            if(instock.goodsNumber==null||instock.goodsNumber==""){
                ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND, "商品编号不能为空")
                return
            }
            if(instock.num==null||instock.num==""){
                instock.num==1
            }
            // console.log(instock.goodsNumber)
            // console.log(instock.num)
            // console.log(GoodsInfos)
            let goodsInfos = await GoodsInfos.findOne({
                where:{
                    goodsNumber : instock.goodsNumber,
                    tenantId : body.tenantId
                }
            })
            // console.log(goodsInfos)
            let toitalPrice = instock.num*goodsInfos.unitPrice;
            totalPrices+=toitalPrice
            try{
                await InStocks.create({
                    name : goodsInfos.name,
                    goodsNumber : instock.goodsNumber,
                    property : goodsInfos.property,
                    num : instock.num,
                    unit : goodsInfos.unit,
                    batch : patch,
                    status : 0,//0为未入库，1为部分入库，2为全部入库
                    unitPrice : goodsInfos.unitPrice,
                    storageNum : 0,//入库数量
                    tenantId : body.tenantId
                })
            }catch(e){
                console.log(e)
                ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR)
                return
            }
        }
        try {
            let paymentPrice = totalPrices-Number(body.discountsPrice)+Number(body.restPrice)
            await StockOrderBatchs.create({
                tenantId : body.tenantId,
                batch : patch,
                status : 0,
                supplierId : body.supplierId,
                info : body.info==null?"":body.info,
                totalPrice : totalPrices,
                discountsPrice : Number(body.discountsPrice),
                restPrice : Number(body.restPrice),
                paymentPrice : paymentPrice,
                alreadyPaymentPrice : Number(body.alreadyPaymentPrice),
                nonPaymentPrice :paymentPrice-Number(body.alreadyPaymentPrice),
                orderTime : new Date()
            })

        }catch (e){
            console.log(e)
            ctx.body = new ApiResult(ApiResult.Result.SELECT_ERROR)
            return
        }
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },

    // async updateInStock(ctx,next){
    //     ctx.checkBody('id').notBlank()
    //     ctx.checkBody('pageNumber').notBlank()
    //     ctx.checkBody('num').notBlank()
    //     ctx.checkBody('personInCharge').notEmpty()
    //
    //     ctx.checkBody('tenantId').notBlank()
    //     let body = ctx.request.body
    //     let inStock = await InStocks.findOne({
    //         where:{
    //             tenantId : body.tenantId,
    //             pageNumber : body.pageNumber,
    //             id : body.id
    //         }
    //     })
    //     if(inStock==null){
    //         ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"没有找到次记录")
    //         return
    //     }
    //     inStock.num = body.num;
    //     inStock.personInCharge = body.personInCharge;
    //     await inStock.save()
    //
    //     ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    //
    // },
    async updateInStock(ctx,next){
        ctx.checkBody('tenantId').notBlank();
        ctx.checkBody('batch').notBlank()
        ctx.checkBody('goodsNumber')
        ctx.checkBody('storageNum').notBlank();
        // ctx.checkBody('batch').notEmpty();
        // ctx.checkBody('inStock').notBlank()
        // ctx.checkBody('constPrice').notBlank()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let body = ctx.request.body
        let inStock = await InStocks.findOne({
            where:{
                tenantId : body.tenantId,
                batch : body.batch,
                goodsNumber : body.goodsNumber
            }
        })





        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    },
    async getInStockByName(ctx,next){
        ctx.checkQuery('name').notEmpty()
        ctx.checkQuery('tenantId').notEmpty()
        // ctx.checkQuery('goodsStatus').notEmpty()
        // ctx.checkQuery('unitPrice').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let inStocks
        if(ctx.query.goodsStatus!=null){
            inStocks = await InStocks.findAll({
                where:{
                    name : ctx.query.name,
                    tenantId :ctx.query.tenantId,
                    goodsStatus : ctx.query.goodsStatus
                }
            })
        }else{
            inStocks = await InStocks.findAll({
                where:{
                    name : ctx.query.name,
                    tenantId :ctx.query.tenantId
                }
            })
        }

        let goodNum = 0 //总个数
        let constPrice = 0//单价
        let totalPrice = 0 //总价格

        for(let i = 0; i < inStocks.length; i++){
            goodNum+= Number(inStocks[i].num)
            totalPrice += Number(inStocks[i].totalPrice)
            constPrice += Number(inStocks[i].unitPrice)
        }
        let inStockJson = {}
        inStockJson.goodNum = goodNum;
        inStockJson.totalPrice = totalPrice;
        inStockJson.constPrice = constPrice;
        inStockJson.inStocks = inStocks;
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,inStockJson)
    },
    async getInStockByTenantId(ctx,next){
        // ctx.checkQuery('name').notEmpty()
        ctx.checkQuery('tenantId').notEmpty()
        // ctx.checkQuery('unitPrice').notEmpty()
        // ctx.checkQuery('status').notEmpty()

        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let stockOrderBatchs
        if(ctx.query.status!=null&&ctx.query.status!=""){
            stockOrderBatchs = await StockOrderBatchs.findAll({
                where:{
                    tenantId : ctx.query.tenantId,
                    status:ctx.query.status,
                }
            })
        }else{
            stockOrderBatchs = await StockOrderBatchs.findAll({
                where:{
                    tenantId : ctx.query.tenantId,
                }
            })
        }
        console.log(stockOrderBatchs.length)

        let stockOrderBatchsArray = []
        for(let i = 0; i <stockOrderBatchs.length; i++){
            let stockOrderBatchsJson = {}
            console.log(stockOrderBatchs[i].batch)
            let instock = await InStocks.findAll({
                where:{
                    // tenantId : stockOrderBatchs[i].tenantId,
                    batch : stockOrderBatchs[i].batch,
                }
            })
            console.log(instock)
            stockOrderBatchsJson.batch = stockOrderBatchs[i].batch
            stockOrderBatchsJson.tenantId = stockOrderBatchs[i].tenantId
            stockOrderBatchsJson.status = stockOrderBatchs[i].status
            stockOrderBatchsJson.personInCharge = stockOrderBatchs[i].personInCharge
            stockOrderBatchsJson.totalPrice = stockOrderBatchs[i].totalPrice
            stockOrderBatchsJson.discountsPrice = stockOrderBatchs[i].discountsPrice
            stockOrderBatchsJson.restPrice = stockOrderBatchs[i].restPrice
            stockOrderBatchsJson.paymentPrice = stockOrderBatchs[i].paymentPrice
            stockOrderBatchsJson.alreadyPaymentPrice = stockOrderBatchs[i].alreadyPaymentPrice
            stockOrderBatchsJson.nonPaymentPrice = stockOrderBatchs[i].nonPaymentPrice
            stockOrderBatchsJson.time = stockOrderBatchs[i].orderTime
            stockOrderBatchsJson.instock=instock
            stockOrderBatchsArray.push(stockOrderBatchsJson)
        }


        // let inStocksNameArray = []
        // for(let ins of inStocks){
        //     if(!inStocksNameArray.contains(ins.name)){
        //         inStocksNameArray.push(ins.name)
        //     }
        // }
        // let inStocksArray = []
        // for(let i = 0; i <inStocksNameArray.length; i++) {
        //     let totalPrice = 0;
        //     let num = 0;
        //     let constPrice = 0;
        //     let inStocksJson = {}
        //     let inStocksName = await InStocks.findAll({
        //         where:{
        //             tenantId : ctx.query.tenantId,
        //             name : inStocksNameArray[i]
        //         }
        //     })
        //     for(let j = 0; j < inStocksName.length; j++){
        //         totalPrice += Number(inStocksName[i].totalPrice);
        //         num += Number(inStocksName[i].num);
        //         constPrice += Number(inStocksName[i].unitPrice)
        //     }
        //     inStocksJson.totalPrice = totalPrice;
        //     inStocksJson.num = num;
        //     inStocksJson.constPrice = constPrice;
        //     inStocksJson.name = inStocksNameArray[i];
        //     inStocksJson.unit = inStocksName[0].unit;
        //     inStocksJson.prototype = inStocksName[0].prototype;
        //     inStocksJson.tenantId = ctx.query.tenantId
        //     inStocksArray.push(inStocksJson)
        // }

        ctx.body = new ApiResult(ApiResult.Result.SUCCESS,stockOrderBatchsArray)
    },
    async deleteInStock(ctx,next){
        ctx.checkQuery('pageNumber').notEmpty()
        ctx.checkQuery('id').notEmpty()
        if(ctx.errors){
            ctx.body = new ApiResult(ApiResult.Result.PARAMS_ERROR,ctx.errors)
            return
        }
        let inStock = await InStocks.findOne({
            where:{
                pageNumber : ctx.query.pageNumber,
                id : ctx.query.id
            }
        })
        if(inStock==null){
            ctx.body = new ApiResult(ApiResult.Result.NOT_FOUND,"找不到此记录")
            return
        }
        await inStock.destroy()
        ctx.body = new ApiResult(ApiResult.Result.SUCCESS)
    }
}


