const Sequelize = require('sequelize')

const String = (num, allowNull) => {
  if (!num) {
    num = 2048
  }
  if (!allowNull) {
    allowNull = false
  }
  return {
    type: Sequelize.STRING(num),
    allowNull
  }
}

const Double = (defaultValue) => {
  if (typeof defaultValue === 'undefined') {
    defaultValue = 0
  }
  return {
    type: Sequelize.DOUBLE,
    defaultValue
  }
}

const Int = (defaultValue) => {
  if (typeof defaultValue === 'undefined') {
    defaultValue = 0
  }
  return {
    type: Sequelize.INTEGER,
    defaultValue
  }
}

const Phone = (allowNull) => {
  if (typeof allowNull === 'undefined') {
    allowNull = false
  }
  return {
    type: Sequelize.STRING(11),
    allowNull,
    validate: {
      is: /^\d{11}$/
    }
  }
}

const Url = () => {
  return {
    type: Sequelize.STRING,
    allowNull: false,
    vialidate: {
      isUrl: true
    }
  }
}

const Date = (defaultValue) => {
  if (typeof defaultValue === 'undefined') {
    defaultValue = Sequelize.NOW
  }
  return {
    type: Sequelize.DATE,
    defaultValue
  }
}

const Bool = () => {
  return {
    type: Sequelize.BOOLEAN
  }
}

const Text = () => {
  return {
    type: Sequelize.TEXT
  }
}

const filterByStatus = (status) => {
  return function*(conditions) {
    conditions.where = {
      status: status
    }
    return yield this.findAll(conditions)
  }
}

module.exports = {
  DataTypes: {
    String,
    Phone,
    Int,
    Url,
    Date,
    Double,
    Bool,
    Text
  },
  Func: {
    filterByStatus
  }
}
