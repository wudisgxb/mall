
var db = require('../../db/mysql/index');
var Admins = db.models.Adminer;
const orderStatistic = require('../../controller/admin/orderStatistic');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/orderStatistic', orderStatistic.getOrderStatistic);
 router.post('/api/test/admin/ordersStatistic', orderStatistic.saveOrderStatistic);
router.get('/api/test/admin/ordersStatistic',orderStatistic.getAllOrderStatistic);

// router.put('/api/test/admin/ordersStatistic',orderStatistic.putOrderStatistic)
router.put('/api/test/admin/orders/ordersStatistic',orderStatistic.updateOrder)

router.put('/api/test/admin/ordersStatistic',orderStatistic.putOrderStatistic);

//开发临时测试，把订单状态2，deletedAt置null
router.post('/api/test/admin/orderStatus',orderStatistic.status2Mdf);


module.exports = router