const sequelizex = require('../../../db/mysql/sequelizex');
const shortDataTypes = sequelizex.DataTypes;

module.exports = function(sequelize, DataTypes) {

  return sequelize.define('QRCode', {
    /**
     * 场景
     */
    scene: shortDataTypes.String(),
    /**
     * 商户名称
     */
    merchantName: shortDataTypes.String(),
    /**
     * 纬度
     */
    latitude: shortDataTypes.Double(),
    /**
     * 经度
     */
    longitude: shortDataTypes.Double(),
    /**
     * 重定向url
     */
    url: shortDataTypes.String(),
    /**
     * 是否可用
     */
    enable: shortDataTypes.Boolean(),
    /**
     * 被扫描次数
     */
    numberOfScan: shortDataTypes.Int()
  }, {
    timestamps: false,
    associate: function(models) {},
    instanceMethods: {},
    classMethods: {}
  });
};
