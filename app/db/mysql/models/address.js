var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Address =  sequelize.define('Address', {
        //省
        province: shortDataTypes.String(),
        //市
        city: shortDataTypes.String(),
        //区
        area:shortDataTypes.String(),
        //详细地址
        address:shortDataTypes.String(),
    }, {
        timestamps: false,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return Address;
};

