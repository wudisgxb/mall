/**
 * Created by lxc on 16-1-11.
 */

var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;

module.exports = function (sequelize, DataTypes) {

    var Rank = sequelize.define('Rank', {

        name:shortDataTypes.String(),
        min: shortDataTypes.Int(),
        max: shortDataTypes.Int(),

    }, {
        associate: function (models) {

        },
        instanceMethods: {
        },
        classMethods: {
        }
    });

    return Rank;
};
