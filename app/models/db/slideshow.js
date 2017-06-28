/**
 * Created by lxc on 16-1-16.
 */

var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');

module.exports = function (sequelize, DataTypes) {

    var Slideshow = sequelize.define('Slideshow', {

        link: shortDataTypes.String(),

        address: shortDataTypes.String(),


    }, {
        timestamps: true,
        paranoid: true,
        associate: function (models) {

        },
        instanceMethods: {
        },
        classMethods: {
        }
    });

    return Slideshow;
};
