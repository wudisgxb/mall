let order = require('../../controller/customer/order');

const router = new (require('koa-router'))()

router.get('/api/test/customer/deal/order', order.getUserDealOrder.bind(order));

router.post('/api/test/customer/deal/order', order.saveUserDealOrder);

router.post('/api/test/customer/eshop/order', order.saveUserEshopOrder);

router.put('/api/test/customer/eshop/order', order.updateUserEshopOrder);

router.delete('/api/test/customer/eshop/order', order.deleteUserEshopOrder);

router.get('/api/test/customer/eshop/order', order.getUserEshopOrder.bind(order));

//通过手机号，代售id查所有订单
router.get('/api/test/customer/eshop/consignee/order', order.getUserEshopConsigneeOrder.bind(order));

module.exports = router
