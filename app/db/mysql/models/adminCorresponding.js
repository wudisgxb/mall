
var sequelizex = require('../../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    return sequelize.define('AdminCorresponding', {

        //电话
        phone: shortDataTypes.Phone(),
        /**
         * 1.为平台
         * 2.为商圈
         * 3.租户
         */
        correspondingType : shortDataTypes.String(),
        correspondingId : shortDataTypes.String(),
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



