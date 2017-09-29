var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var TableMakeAppintment = sequelize.define('TableMakeAppintment', {
        tenantId: shortDataTypes.String(),
        phone: shortDataTypes.Phone(),
        isMakeAppintment: shortDataTypes.String(),//是否预约过
        tableId: shortDataTypes.String(),
        makeAppintmentStartTime : shortDataTypes.Date(),
        makeAppintmentEndTime : shortDataTypes.Date(),
        status : shortDataTypes.Bool(),
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

    return TableMakeAppintment;
};
