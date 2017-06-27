const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes
const util = require('util')

module.exports = function(sequelize, DataTypes) {

  const Slideshow = sequelize.define('SlideShow', {

    link: shortDataTypes.String(),

    address: shortDataTypes.String(),


  }, {
    timestamps: true,
    paranoid: true,
    associate: function(models) {

    },
    instanceMethods: {},
    classMethods: {}
  })

  return Slideshow
}
