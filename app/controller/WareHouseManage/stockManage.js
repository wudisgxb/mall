const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/mysql/index');
let WareHouseManage = db.models.WareHouseManage
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
        let wareHouseManage
        if(arguments.length==1){
            wareHouseManage = await WareHouseManage.findAll({
                where:whereJson
            })
        }
        if(arguments.length==2){
            wareHouseManage = await WareHouseManage.findAll({
                where:whereJson,
                offset: Number(LimitJson.place),
                limit: Number(LimitJson.pageSize)
            })
        }
        if(arguments.length==3){
            wareHouseManage = await WareHouseManage.findAll({
                where:whereJson,
                offset: Number(LimitJson.place),
                limit: Number(LimitJson.pageSize),
                order : OrderJson.order
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