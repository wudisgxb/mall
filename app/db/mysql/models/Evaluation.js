const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes
const util = require('util')

module.exports = function(sequelize, DataTypes) {

  const Evaluation = sequelize.define('Evaluation', {
    text: shortDataTypes.String(),
    isShow: shortDataTypes.Bool()
  }, {
    timestamps: true,
    associate: function(models) {
      models.Order.hasMany(models.Evaluation)
      models.Evaluation.belongsTo(models.Order)
      models.User.hasMany(models.Evaluation)
      models.Evaluation.belongsTo(models.User)
    },
    instanceMethods: {},
    classMethods: {}
  })

  return Evaluation
}
