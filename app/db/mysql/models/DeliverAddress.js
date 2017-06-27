const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes

module.exports = function(sequelize, DataTypes) {

  /**
   * 收货地址
   */
  const DeliverAddress = sequelize.define('DeliverAddress', {
    /**
     * 收货人姓名
     */
    recieverName: shortDataTypes.String(),
    phone: shortDataTypes.Phone(),
    province: shortDataTypes.String(),
    city: shortDataTypes.String(),
    area: shortDataTypes.String(),
    address: shortDataTypes.String(),
    isDefault: shortDataTypes.Bool()
  }, {
    timestamps: false,
    associate: function(models) {
      models.User.hasMany(models.DeliverAddress)
      models.DeliverAddress.belongsTo(models.User)
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

  return DeliverAddress
}
