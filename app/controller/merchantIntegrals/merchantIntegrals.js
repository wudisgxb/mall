let db = require('../../db/mysql/index');
let MerchantSetIntegrals = db.models.MerchantSetIntegrals

const sqlMerchantIntegrals = (function () {
    let saveMerchantIntegrals = async function (whereJson) {
        await MerchantSetIntegrals.create(whereJson)
    }
    let getMerchantIntegrals = async function (whereJson) {
        let getMerchantIntegral = await MerchantSetIntegrals.findOne({
            where: whereJson
        })
        return getMerchantIntegral
    }
    let getMerchantIntegralsAll = async function (whereJson) {
        let getMerchantIntegral = await MerchantSetIntegrals.findAll({
            where: whereJson
        })
        return getMerchantIntegral
    }
    let updateMerchantIntegrals = async function (updateJson, whereJson) {
        let merchantIntegral = await MerchantSetIntegrals.update(updateJson, {
            where: whereJson
        })
    }

    let instance = {
        saveMerchantIntegrals: saveMerchantIntegrals,
        getMerchantIntegrals: getMerchantIntegrals,
        updateMerchantIntegrals: updateMerchantIntegrals,
        getMerchantIntegralsAll: getMerchantIntegralsAll
    }
    return instance;
})();

module.exports = sqlMerchantIntegrals;
