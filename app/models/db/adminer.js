var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;
var Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {

    return sequelize.define('Adminer', {
        /**
         * 登录名，不可重复
         */
        nickname: shortDataTypes.String(),
        /***
         * 真实姓名
         */
        name: shortDataTypes.String(),
        /**
         * 密码
         */
        password: shortDataTypes.String(),
        /**
         * 手机号
         */
        phone: shortDataTypes.Phone(),
        /**
         * 状态
         */
        status: shortDataTypes.Int(),
        /**
         * 管理员类型
         * 1 => 商品管理
         * 2 => 会员管理
         * 3 => 交易管理
         * 4 => 分销管理
         * 99 => 管理员
         * 100 => 超级管理员
         */
        type: shortDataTypes.Int(),
        tenantId : {
            type: Sequelize.STRING
        }
        

    }, {
        timestamps: false,
        associate: function (models) {
        },
        instanceMethods: {},
        classMethods: {}
    });
};

