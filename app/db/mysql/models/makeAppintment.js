var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var MakeAppintments = sequelize.define('MakeAppintments', {
        /**
         * 主商户名
         */

        makeAppintmentId: shortDataTypes.String(100, false),//预约ID
        tenantId: shortDataTypes.String(100, false),//租户
        phone: shortDataTypes.Phone(),//客户的电话号码
        makeAppintmentPeopleNumber : shortDataTypes.String(100, false),//预约人数
        makeAppintmentTableId : shortDataTypes.String(100, false),//预约桌子号码
        makeAppintmentStartTime : shortDataTypes.Date(),//预约时间
        makeAppintmentEndTime : shortDataTypes.Date(),//预约时间
        status : shortDataTypes.String(100, false),//状态
    }, {
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
    return MakeAppintments;
};



