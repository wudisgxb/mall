const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
const logger = require('koa-log4').getLogger('AddressController')
let db = require('../../db/Mysql/index')
let Distanceandprice = db.models.DistanceAndPrices

const distanceAndPrice = (function () {
    //查询所有配送信息
    let getdistanceandprice = async function (tenantId) {
        let distanceandprice = await Distanceandprice.findAll({
            where :{
                tenantId : tenantId
            }
        })
        return distanceandprice;
    }
    //查询单个品配送信息
    let getdistanceandpriceOne = async function (getJson) {
        let distanceandprice = await Distanceandprice.findOne({
            where : getJson
        })
        if(distanceandprice==null){
            return "没有此数据"
        }
        return distanceandprice;
    }
    //根据商品信息+条件查询
    let getdistance = async function (getAll,distance) {
        for(let dis of getAll){
            let min = dis.minDistance;
            let max = dis.maxDistance;
            if(distance>=min&&distance<max){
                result.push(dis)
            }
        }
        return result;
    }
    //新增配送信息
    let saveDistanceAndPrice = async function (saveJson) {
        let distanceandprice = await Distanceandprice.create(saveJson)
        return distanceandprice;
    }
    //修改配送信息
    let updateDistanceAndPrice = async function (updateJson,whereJson) {
        let distanceandprice = await Distanceandprice.update(updateJson,{where:whereJson});
        return distanceandprice
    }
    //删除配送信息
    // let deleteDistanceAndPrice = async function (deleteJson) {
    //     return await deleteJson.destroy()
    // }


    let instance = {
        getdistanceandprice : getdistanceandprice,
        saveDistanceAndPrice : saveDistanceAndPrice,
        updateDistanceAndPrice : updateDistanceAndPrice,
        // deleteDistanceAndPrice :deleteDistanceAndPrice,
        getdistanceandpriceOne : getdistanceandpriceOne,
        getdistance : getdistance
    }

    return instance;
})();
module.exports = distanceAndPrice;
