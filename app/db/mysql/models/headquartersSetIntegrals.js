var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
    //商圈Id
    var HeadquartersSetIntegrals = sequelize.define('HeadquartersSetIntegrals', {
        headQuartersId : shortDataTypes.String(100, false),//商圈Id
        // vipLevel: shortDataTypes.String(100, false),//Vip等级
        priceIntegralsRate : shortDataTypes.String(100, false),//每一积分对应的价格
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return HeadquartersSetIntegrals;
};
