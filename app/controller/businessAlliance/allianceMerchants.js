
const sqlOperation = (function () {
    let getOperations = async function (sequelize,whereJson) {
        let sequelizeAll = await sequelize.findAll({
            where:whereJson
        })
        return sequelizeAll
    }
    let getOperation = async function (sequelize,whereJson) {
        let sequelizeOne = await sequelize.findOne({
            where:whereJson
        })
        // console.log(headquarters)
        return sequelizeOne
    }
    let createOperation = async function (sequelize,whereJson) {
        // console.log(whereJson)
        await sequelize.create(
            whereJson
        )
    }
    let updateOperation = async function (sequelize,updatejson,whereJson) {
        await sequelize.update(updatejson,{where:whereJson})
    }
    let deleteOperation = async function (sequelize,deleteJson) {
        await sequelize.destroy({where:deleteJson})
    }

    let instance={
        getOperation : getOperation,
        createOperation : createOperation,
        updateOperation : updateOperation,
        deleteOperation : deleteOperation,
        getOperations : getOperations
    }
    return instance

})();
module.exports = sqlOperation
