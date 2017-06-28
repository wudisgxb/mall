var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var smsVerification = sequelize.define('smsVerification', {
        phone: shortDataTypes.Phone(),
        date:shortDataTypes.Date(),
        code:shortDataTypes.Int(),
        tenantId : {
            type: Sequelize.STRING




            
        }
    }, {
        associate: function (models) {
        },
        instanceMethods: {
        },
        classMethods: {
        },
        scopes: {
        }
    });
    return smsVerification;
};

