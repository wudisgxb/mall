/**
 * Created by lxc on 16-1-9.
 */
var sequelizex = require('../../lib/sequelizex');
var shortDataTypes = sequelizex.DataTypes;

module.exports = function (sequelize, DataTypes) {

    var Comment = sequelize.define('Comment', {


        score: shortDataTypes.Int(),
        /**
         * 0 => 不显示
         * 1 => 显示
         */
        status: shortDataTypes.Int(),

        message: shortDataTypes.String(),


    }, {
        associate: function (models) {
            models.User.hasMany(models.Comment);
            models.Comment.belongsTo(models.User);
            models.Goods.hasMany(models.Comment);
            models.Comment.belongsTo(models.Goods);
        },
        instanceMethods: {
        },
        classMethods: {
        }
    });

    return Comment;
};

