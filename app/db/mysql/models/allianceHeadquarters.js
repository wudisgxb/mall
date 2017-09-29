var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    return sequelize.define('AllianceHeadquarters', {
        //联盟Id
        alliancesId: shortDataTypes.String(),
        //总部Id
        headquartersId: shortDataTypes.String(),
        //联盟备注
        alliancesRemark: shortDataTypes.String(),
        //总部备注
        headquartersRemark: shortDataTypes.String(),
        // //联盟分润
        // allianceRate: shortDataTypes.String(),
        // //总部分润
        // headquartersRate: shortDataTypes.String(),
        //联盟名字
        alliancesName: shortDataTypes.String(),
        //总部名字
        headquartersName: shortDataTypes.String(),

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
};