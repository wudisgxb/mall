const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes

module.exports = function(sequelize, DataTypes) {

  const Msg = sequelize.define('Msg', {
    title: shortDataTypes.String(400),
    link: shortDataTypes.String(),
    /**
     * 0 => 未读
     * 1 => 已读
     */
    status: shortDataTypes.Int()
  }, {
    associate: function(models) {
      models.User.hasMany(models.Msg)
      models.Msg.belongsTo(models.User)
    },
    instanceMethods: {},
    classMethods: {
      myCount: function*(userId) {
        return yield this.count({
          where: {
            UserId: userId
          }
        })
      }
    }
  })

  return Msg
}
