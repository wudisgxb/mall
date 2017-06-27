const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes
const util = require('util')

module.exports = function(sequelize, DataTypes) {

  const Favorite = sequelize.define('Favorite', {}, {
    timestamps: true,
    associate: function(models) {
      models.User.hasMany(models.Favorite)
      models.Favorite.belongsTo(models.User)
      models.Store.hasMany(models.Favorite)
      models.Favorite.belongsTo(models.Store)
    },
    instanceMethods: {},
    classMethods: {}
  })

  return Favorite
}
