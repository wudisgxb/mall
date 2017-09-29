const db = require('../../db/mysql/index');
const Alliances = db.models.Alliances;
const sqlAlliances = (function () {
    let getAlliances = async function (whereJson) {
        let alliance = await Alliances.findOne({
            where:whereJson
        })
        // console.log(headquarters)
        return alliance
    }
    let createAlliances = async function (whereJson) {
        // console.log(whereJson)
        await Alliances.create(
            whereJson
        )
        // console.log(1111)
    }
    let updateAlliances = async function (updatejson,whereJson) {
        await Alliances.update(updatejson,{where:whereJson})
    }
    let deleteAlliances = async function (deleteJson) {
        await Alliances.destroy({where:deleteJson})
        console.log(Alliances)
    }

    let instance={
        getAlliances : getAlliances,
        createAlliances : createAlliances,
        updateAlliances : updateAlliances,
        deleteAlliances : deleteAlliances
    }
    return instance

})();
module.exports = sqlAlliances
