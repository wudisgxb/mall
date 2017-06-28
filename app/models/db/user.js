var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;

module.exports = function (sequelize, DataTypes) {

	var User = sequelize.define('User', {
		/**
		 * 客户的登录名
		 */
        nickname: shortDataTypes.String(),

		headimgurl: shortDataTypes.Url(),
		/**
		 * 客户的性别
		 */
		sex: shortDataTypes.Int(),
		/**
		 * 是否与二维码绑定
		 */


        openid: shortDataTypes.String(),

        joinTime: shortDataTypes.Date(),
		subscribe_time: shortDataTypes.Date(),
		unionid: shortDataTypes.String(),
		totalIntegral: shortDataTypes.Double(),
		integral: shortDataTypes.Double(),
		/**
		 */
        status: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		}
	}, {
        timestamps: false,
		associate: function (models) {
			models.Adminer.hasMany(models.User);
			models.User.belongsTo(models.Adminer);
		},
		instanceMethods: {
		},
		classMethods: {
		}
	});

	return User;
};

