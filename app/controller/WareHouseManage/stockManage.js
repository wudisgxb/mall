const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let WareHouseManage = db.models.WareHouseManages
const sqlStockManage = (function () {

    //进货添加商品
    let saveStockGoods = async function (createJson) {
        await WareHouseManage.create(createJson)
    }
    let updateStockGoods = async function (updateJson,whereJson) {
        await WareHouseManage.update(updateJson,{
            where:whereJson
        })
    }
    let getStockGoodOne = async function (whereJson) {
        let wareHouseManage = await  WareHouseManage.findOne({
            where:whereJson
        })
        return wareHouseManage
    }
    let getStockGoods = async function (whereJson,LimitJson,OrderJson) {
        console.log(WareHouseManage)
        let wareHouseManage
        if(arguments.length==1){
            console.log(1111)
            wareHouseManage = await WareHouseManage.findAll({
                where:whereJson
            })
        }
        if(arguments.length==2){

            wareHouseManage = await WareHouseManage.findAll({
                where:whereJson,
                offset : LimitJson.offset,
                limit : LimitJson.limit
            })
        }
        if(arguments.length==3){
            wareHouseManage = await WareHouseManage.findAll({
                where:whereJson,
                LimitJson,
                OrderJson
            })
        }
        return wareHouseManage
    }
    let getStockGoodsSum = async function (sum,whereJson) {
        let wareHouseManageSum = await WareHouseManage.sum(sum,{
            where:whereJson
        })
        return wareHouseManageSum
    }
    let getStockGoodsCount = async function (whereJson) {
        let wareHouseManageCount = await WareHouseManage.count({
            where:whereJson
        })
        return wareHouseManageCount
    }
    
    let instance = {
        saveStockGoods : saveStockGoods,
        updateStockGoods : updateStockGoods,
        getStockGoodOne : getStockGoodOne,
        getStockGoods : getStockGoods,
        getStockGoodsSum : getStockGoodsSum,
        getStockGoodsCount :getStockGoodsCount

    }
    return instance
})()
module.exports = sqlStockManage;