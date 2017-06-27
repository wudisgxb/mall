const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes
const util = require('util')

module.exports = function(sequelize, DataTypes) {

  const GoodsOfType = sequelize.define('GoodsOfType', {}, {
    associate: function(models) {
      models.GoodsType.hasMany(models.GoodsOfType)
      models.GoodsOfType.belongsTo(models.GoodsType)
      models.Goods.hasMany(models.GoodsOfType)
      models.GoodsOfType.belongsTo(models.Goods)
    }
  })

  return GoodsOfType
}
