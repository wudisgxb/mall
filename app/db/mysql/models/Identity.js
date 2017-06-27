const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes

module.exports = function(sequelize, DataTypes) {

  /**
   * 收货地址
   */
  const Identity = sequelize.define('Identity', {
    name: shortDataTypes.String(),
    phone: shortDataTypes.Phone(),
    identityNum: shortDataTypes.String(),
    isDefault: shortDataTypes.Bool()
  }, {
    timestamps: false,
    associate: function(models) {
      models.User.hasMany(models.Identity)
      models.Identity.belongsTo(models.User)
    },
    instanceMethods: {},
    classMethods: {
      my: function*(whoAmI) {
        return yield this.findAll({
          where: {
            UserId: whoAmI
          }
        })
      }
    }
  })

  return Identity
}
