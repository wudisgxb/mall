var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var AllianceMerchants = sequelize.define('AllianceMerchants', {
        //联盟ID
        alliancesId : shortDataTypes.String(),
        //租户Id
        tenantId : shortDataTypes.String(),
        //联盟备注
        allianceRemark : shortDataTypes.String(255,true),
        //租户备注
        tenantRemark : shortDataTypes.String(255,true),
        // 总部分润
        // headquartersRate : shortDataTypes.String(),
        // //租户分润
        // tenantRate : shortDataTypes.String(),
        // //联盟分润
        // allianceRate : shortDataTypes.String(),
        //租户名字
        tenantName : shortDataTypes.String(),
        //联盟名字
        allianceName : shortDataTypes.String(),
    }, {
        paranoid: true,
        associate: function (models) {
        },
        classMethods: {},
        getterMethods: {},
        scopes: {
            all: {
                paranoid: false,
            }
        }

    });
    return AllianceMerchants;
};
