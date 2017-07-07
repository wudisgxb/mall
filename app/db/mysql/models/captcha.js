var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var Captcha = sequelize.define('Captcha', {

        key:shortDataTypes.String(),
        captcha:shortDataTypes.String(),
    }, {
        paranoid: true,
        associate: function (models) {
            // models.Menus.hasMany(models.Foods);
            // models.Foods.belongsTo(models.Menus);
        },
        classMethods: {},
        getterMethods: {},
    });


    return Captcha;
};
