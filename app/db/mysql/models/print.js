var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var Prints = sequelize.define('Prints', {
        printName: {
            type: Sequelize.STRING
        },
        deviceName: {
            type: Sequelize.STRING
        },
        printType: {
            type: Sequelize.STRING
        },
        printTime: {
            type: Sequelize.STRING
        },
        isNeedCustomSmallTicketHeader: shortDataTypes.Bool(),
        customSmallTicketHeader: {
            type: Sequelize.STRING
        },
        smallTicketNum: shortDataTypes.Int(),
        isShowMoney: shortDataTypes.Bool(),
        printModel: {
            type: Sequelize.STRING
        },
        tenantId: {
            type: Sequelize.STRING
        }
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {},
        scopes: {
            all: {
                paranoid: false,
            }
        }
    });

    return Prints;
};

