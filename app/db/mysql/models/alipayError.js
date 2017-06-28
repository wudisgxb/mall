var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var util = require('util');
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    var AlipayErrors = sequelize.define('AlipayErrors', {

        errRsp: shortDataTypes.String(),
        signFlag: shortDataTypes.Bool(),
        tenantId : {
            type: Sequelize.STRING
        }
    }, {
        paranoid: true,
        associate: function (models) {
        },
        classMethods: {
        },
        getterMethods: {

        },
        scopes: {
            deleted: {
                where: {
                    deletedAt: {
                        $ne: null
                    }
                },
                paranoid: false,
            },
            all: {
                paranoid: false,
            }
        }

    });


    return AlipayErrors;
};
