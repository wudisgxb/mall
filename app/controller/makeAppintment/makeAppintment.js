
let db = require('../../db/mysql/index');
let MakeAppintments = db.models.MakeAppintments
let Tables = db.models.Tables


const sqlMerchantIntegrals = (function () {

    let saveMakeAppintment = async function (whereJson) {
        console.log("3333333333333333")
        await MakeAppintments.create(whereJson)

    }
   
    let table = async function (whereJson) {
        let tableAll = await Tables.findAll({
            where:whereJson
        })
        return tableAll
    }
   
    let tableAll = async function (whereJson) {
        let tableAll = await Tables.findAll({where:whereJson})
        return tableAll
    }
    let getMakeAppintment = async function (whereJson) {
        let getMakeAppintment = await MakeAppintments.findOne({
            where: whereJson
        })
        return getMakeAppintment
    }
    let getMakeAppintmentAll = async function (whereJson) {
        let getMakeAppintment = await MakeAppintments.findAll({
            where: whereJson
        })
        return getMakeAppintment
    }
    let updateMakeAppintment = async function (updateJson, whereJson) {
        let merchantIntegral = await MakeAppintments.update(updateJson, {
            where: whereJson
        })
    }
    let deleteMakeAppintment = async function (whereJson) {
        let merchantIntegral = await MakeAppintments.destroy({
            where:whereJson
        })
    }
    let instance = {
        saveMakeAppintment: saveMakeAppintment,
        getMakeAppintment: getMakeAppintment,
        getMakeAppintmentAll: getMakeAppintmentAll,
        updateMakeAppintment: updateMakeAppintment,
        table: table,
        tableAll : tableAll,
        deleteMakeAppintment : deleteMakeAppintment
    }
    return instance;
})();

module.exports = sqlMerchantIntegrals;