const db = require('../../db/mysql/index');
const AllianceHeadquarters = db.models.AllianceHeadquarters;

const sqlAllianceHeadquarters = (function () {
    let getAllianceHeadquarterAll = async function (whereJson) {
        let allianceHeadquarters = await AllianceHeadquarters.findAll({
            where:whereJson
        })
        // console.log(headquarters)
        return allianceHeadquarters
    }
    let getAllianceHeadquarters = async function (whereJson) {
        let allianceHeadquarters = await AllianceHeadquarters.findOne({
            where:whereJson
        })
        // console.log(headquarters)
        return allianceHeadquarters
    }
    let createAllianceHeadquarters = async function (whereJson) {
        // console.log(whereJson)
        await AllianceHeadquarters.create(
            whereJson
        )
    }
    let updateAllianceHeadquarters = async function (updatejson,whereJson) {
        await AllianceHeadquarters.update(updatejson,{where:whereJson})
    }
    let deleteAllianceHeadquarters = async function (deleteJson) {
        await AllianceHeadquarters.destroy({where:deleteJson})
        console.log(AllianceHeadquarters)
    }

    let instance={
        getAllianceHeadquarters : getAllianceHeadquarters,
        createAllianceHeadquarters : createAllianceHeadquarters,
        updateAllianceHeadquarters : updateAllianceHeadquarters,
        deleteAllianceHeadquarters : deleteAllianceHeadquarters,
        getAllianceHeadquarterAll : getAllianceHeadquarterAll
    }
    return instance

})();
module.exports = sqlAllianceHeadquarters
