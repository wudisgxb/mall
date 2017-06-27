const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes
const util = require('util')

module.exports = function(sequelize, DataTypes) {

  const SalerGoods = sequelize.define('SalerGoods', {
    status: shortDataTypes.Int()
  }, {
    paranoid: true,
    associate: function(models) {
      models.SalerGoods.belongsTo(models.Goods)
      models.SalerGoods.belongsTo(models.Store)
      models.Store.hasMany(models.SalerGoods)
    }
  })

  return SalerGoods
}
