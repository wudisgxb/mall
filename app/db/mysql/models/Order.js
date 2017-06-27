const sequelizex = rootRequire('app/db/mysql/sequelizex')
const shortDataTypes = sequelizex.DataTypes
const Decimal = require('decimal.js')

module.exports = function(sequelize, DataTypes) {

  const Order = sequelize.define('Order', {
    /**
     * address 对象json
     */
    recieverName: shortDataTypes.String(),
    phone: shortDataTypes.Phone(),
    province: shortDataTypes.String(),
    city: shortDataTypes.String(),
    area: shortDataTypes.String(),
    address: shortDataTypes.String(),
    price: shortDataTypes.Double(),
    num: shortDataTypes.Int(),
    goodsNum: shortDataTypes.Int(),
    tax: shortDataTypes.Double(),

    identityName: shortDataTypes.String(),
    identityPhone: shortDataTypes.Phone(),
    identityNum: shortDataTypes.String(),
    /**
     * 0 => 包邮
     * 1 => 自取
     */
    expressWay: shortDataTypes.Int(),
    /**
     * -2 => 過期取消
     * -1 => 手動取消
     * 0 => 新建订单
     * 1 => 已支付
     * 2 => 已发货
     * 4 => 退货中
     * 10 => 完成
     * 11 => 已评价
     *
     */
    status: shortDataTypes.Int(),
    /**
     * 0 => 未退货
     * 1 => 申请退货
     * 2 => 退货中
     * 3 => 退货完成
     */
    returnStatus: shortDataTypes.Int(),
    /**
     * 留言
     */
    message: shortDataTypes.String(),
    payTime: shortDataTypes.Date(null),
    sendTime: shortDataTypes.Date(null),
    recieveTime: shortDataTypes.Date(null),
    returnRequestTime: shortDataTypes.Date(null),
    returnTime: shortDataTypes.Date(null),
    prepayId: shortDataTypes.String(64, true),
    /**
     * 0 => 本店
     * 1 => 分销
     */
    type: shortDataTypes.Int()
  }, {
    paranoid: true,
    associate: function(models) {
      models.User.hasMany(models.Order)
      models.Order.belongsTo(models.User)
      models.Store.hasMany(models.Order)
      models.Order.belongsTo(models.Store)
    },
    instanceMethods: {
      receive: function*() {
        const order = this

        order.status = 10
        order.recieveTime = Date.now()

        if (!order.OrderItems) {
          order.OrderItems = order.getOrderItems()

        }
        if (!order.Store) {
          order.Store = order.getStore()
        }
        if (!order.User) {
          order.User = order.getUser()
        }



        yield order.save()
          // 积分和佣金

        const stores = []

        const commissions = [0, 0, 0]

        if (order.type == 1 && order.Store) {
          stores.push(order.Store)

          const topStore = yield order.Store.getTopStore()

          if (topStore) {
            stores.push(topStore)
          }

          if (stores.length === 2) {
            topStore = yield topStore.getTopStore()
            if (topStore) {
              stores.push(topStore)
            }
          }
        }

        for (let orderItemIndex = 0; orderItemIndex < order.OrderItems.length; orderItemIndex++) {
          const orderItem = order.OrderItems[orderItemIndex]
          const goods = JSON.parse(orderItem.goods)
          order.User.integral = new Decimal(order.User.integral).plus(goods.integral).toNumber()
          order.User.totalIntegral += new Decimal(order.User.totalIntegral).plus(goods.integral).toNumber()

          for (const storeIndex = 0; storeIndex < stores.length; storeIndex++) {
            commissions[storeIndex] += new Decimal(commissions[storeIndex]).plus(goods["commission" + (storeIndex + 1)]).toNumber()
          }

        }

        yield order.User.save()

        for (let storeIndex = 0; storeIndex < stores.length; storeIndex++) {
          const store = stores[storeIndex]
          store.money = new Decimal(store.money).plus(commissions[storeIndex]).toNumber()
          store.totalMoney = new Decimal(store.totalMoney).plus(commissions[storeIndex]).toNumber()
          yield store.save()
        }
      }
    },
    classMethods: {}
  })

  return Order
}
