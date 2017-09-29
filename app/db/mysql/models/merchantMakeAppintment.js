var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var MerchantMakeAppintment = sequelize.define('MerchantMakeAppintment', {
        tenantId: shortDataTypes.String(100, false),//租户
        status : shortDataTypes.Bool(),//客户是否可以预约
        // mayTableId : shortDataTypes.String() ,//可以预约的桌号
        startMayTableTime : shortDataTypes.Date() ,//可以预约的开始时间
        endMayTableTime : shortDataTypes.Date() ,//可以预约的结束时间
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return MerchantMakeAppintment;
};

