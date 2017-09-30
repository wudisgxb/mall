//暂时没用到
const ApiError = require('../../db/mongo/ApiError')
const ApiResult = require('../../db/mongo/ApiResult')
let db = require('../../db/mysql/index');
let ClienteleIntegrals = db.models.ClienteleIntegrals

const getClienteleIntegrals = (function () {
    let updateClienteleIntegral = async function (updateJson, whereJson) {
        await ClienteleIntegrals.update(updateJson, {where: whereJson})

    }
    let saveClienteleIntegral = async function (whereJson) {
        await ClienteleIntegrals.create(whereJson)

    }
    let getClienteleIntegralAll = async function (whereJson, limitJson) {
        let ClienteleIntegralAll = await ClienteleIntegrals.findAll({
            where: whereJson,
            order: [["createdAt", "DESC"]],
            limit: limitJson.limit,
            offset: limitJson.offset
        })
        // console.log(ClienteleIntegralAll)

        // console.log(ClienteleIntegralArray)
        return ClienteleIntegralAll
    }
    let ClienteleIntegralAllJson = async function (whereJson) {
        let IntegralJson = {
            integralId: whereJson.integralId,
            tenantId: whereJson.tenantId,
            phone: whereJson.phone,
            integralnum: whereJson.integralnum,
            price: whereJson.price,
            integralTime: whereJson.integralTime,
            goodsName: JSON.parse(whereJson.goodsName),
        }
        return IntegralJson
    }
    let getClienteleIntegralOne = async function (whereJson) {
        let ClienteleIntegralOne = await ClienteleIntegrals.findOne({
            where: whereJson
        })
        let json = ClienteleIntegralAllJson(ClienteleIntegralOne)
        return json
    }
    let getClienteleIntegralSum = async function (whereJson) {
        await ClienteleIntegrals.sum("integralnum", whereJson)
    }
    let getClienteleIntegralCount = async function (whereJson) {
        await ClienteleIntegrals.count(whereJson)
    }
    let instance = {
        updateClienteleIntegral: updateClienteleIntegral,
        saveClienteleIntegral: saveClienteleIntegral,
        getClienteleIntegralAll: getClienteleIntegralAll,
        getClienteleIntegralOne: getClienteleIntegralOne,
        getClienteleIntegralCount: getClienteleIntegralCount,
        getClienteleIntegralSum: getClienteleIntegralSum
    }
    return instance;
})();
module.exports = getClienteleIntegrals;
