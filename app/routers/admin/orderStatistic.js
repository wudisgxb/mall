

const orderStatistic = require('../../controller/admin/orderStatistic');
const router = new (require('koa-router'))()
// todo: redirect

 router.post('/api/test/admin/ordersStatistic', orderStatistic.saveOrderStatistic);
router.get('/api/test/admin/ordersStatisticByGetStyle', orderStatistic.getStyle);
router.get('/api/test/admin/getOrderstatisticByPrice', orderStatistic.getOrderstatisticByPrice);
router.get('/api/test/admin/getOrderstatisticByPeople', orderStatistic.getOrderstatisticByPeople);
router.get('/api/test/admin/ordersStatisticByStyle', orderStatistic.getOrderstatisticByStyle);
router.post('/api/test/admin/getActivity', orderStatistic.getActivity);

// router.post('/api/test/admin/ordersStatistic',orderStatistic.getOrderStatistic)
router.put('/api/test/admin/orders/ordersStatistic',orderStatistic.updateOrder)

router.put('/api/test/admin/ordersStatistic',orderStatistic.putOrderStatistic);

//开发临时测试，把订单状态2，deletedAt置null
router.post('/api/test/admin/orderStatus',orderStatistic.status2Mdf);

router.post('/api/test/admin/VipAndCoupons',orderStatistic.saveVipAndCoupons)

module.exports = router