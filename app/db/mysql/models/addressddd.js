var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var AddressDdd = sequelize.define('AddressDdd', {
        //省
        province: shortDataTypes.String(),
        //市
        city: shortDataTypes.String(),
        //区
        area: shortDataTypes.String(),
        //详细地址
        address: shortDataTypes.String(),
        tenantId: shortDataTypes.String(255,true),
        consigneeId: shortDataTypes.String(255,true),
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });

    return AddressDdd;
};

