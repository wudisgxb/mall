const getRegister = (function () {
    let registerAdmin =async function (sequelize,createJson) {
        await sequelize.create(createJson)
    }
    let getAdmin = async function (sequelize,whereJson) {
        let sequelize = await sequelize.findOne({
            where:whereJson
        })
        return sequelize
    }
    let getAdmins = async function (sequelize,whereJson) {
        let sequelizes = await sequelize.findAll({
            where:whereJson
        })
        return sequelizes
    }
    let instance = {
        registerAdmin: registerAdmin,
        getAdmin : getAdmin,
        getAdmins : getAdmins
    }

    return instance;
})();
module.exports = getRegister;

