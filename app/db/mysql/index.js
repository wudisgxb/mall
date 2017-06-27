const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const modelDir = path.join(__dirname, 'models')

// const configs = require('./../../instances/config.js')
const sequelize = new Sequelize('mysql', 'root', '123581321', {
  host: 'localhost',
  logging: function() {}
})

//  autoload
fs
  .readdirSync(modelDir)
  .forEach(function(filename) {
    try {
      sequelize.import(path.join(modelDir, filename))
    } catch (e) {}
  })

const models = sequelize.models
Object.keys(sequelize.models).forEach(function(modelName) {
  if (models[modelName].options.hasOwnProperty('associate')) {
    models[modelName].options.associate(models)
  }
})

module.exports = sequelize
