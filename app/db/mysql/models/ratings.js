var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Ratings = sequelize.define('Ratings', {
        username: shortDataTypes.String(),
        rateTime: shortDataTypes.Date(),
        rateType: shortDataTypes.Int(),
        text: shortDataTypes.String(),
        avatar: shortDataTypes.String(),
        tenantId: {
            type: Sequelize.STRING
        }
    }, {
        associate: function (models) {
            models.Foods.hasMany(models.Ratings);
            models.Ratings.belongsTo(models.Foods);
        },
        instanceMethods: {},
        classMethods: {}
    });

    return Ratings;
};

