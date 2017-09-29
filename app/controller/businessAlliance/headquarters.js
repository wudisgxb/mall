const db = require('../../db/mysql/index');
const Headquarters = db.models.Headquarters;
const sqlHeadquarters = (function () {
    let getHeadquarter = async function (whereJson) {
        let headquarters = await Headquarters.findOne({
            where:whereJson
        })
        // console.log(headquarters)
        return headquarters
    }
    let createHeadquarter = async function (whereJson) {
        // console.log(whereJson)
        await Headquarters.create(
            whereJson
        )
        // console.log(1111)
    }
    let updateHeadquarter = async function (updatejson,whereJson) {
        await Headquarters.update(updatejson,{where:whereJson})
    }
    let deleteHeadquarter = async function (deleteJson) {
        try{
            await Headquarters.destroy({where:deleteJson})
        }catch(e){
            e.name
        }
    }

    let instance={
        getHeadquarter : getHeadquarter,
        createHeadquarter : createHeadquarter,
        updateHeadquarter : updateHeadquarter,
        deleteHeadquarter : deleteHeadquarter
    }
    return instance

})();
module.exports = sqlHeadquarters


