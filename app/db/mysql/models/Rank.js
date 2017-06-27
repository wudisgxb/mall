const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes

module.exports = function(sequelize, DataTypes) {

  const Rank = sequelize.define('Rank', {

    name: shortDataTypes.String(),
    min: shortDataTypes.Int(),
    max: shortDataTypes.Int(),

  }, {
    associate: function(models) {

    },
    instanceMethods: {},
    classMethods: {}
  })

  return Rank
}
