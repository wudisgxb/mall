let order = require('../../controller/customer/order');

const router = new (require('koa-router'))()

router.get('/api/test/customer/deal/order', order.getUserDealOrder.bind(order));

router.post('/api/test/customer/deal/order', order.saveUserDealOrder.bind(order));

router.post('/api/test/customer/eshop/order', order.saveUserEshopOrder.bind(order));

router.put('/api/test/customer/eshop/order', order.updateUserEshopOrder);

router.delete('/api/test/customer/eshop/order', order.deleteUserEshopOrder);

router.get('/api/test/customer/eshop/order', order.getUserEshopOrder.bind(order));

router.put('/api/test/customer/eshop/onlinePayment', order.onlinePayment);

router.get('/api/test/admin/eshop/onlinePayment', order.getOnlinePayment);

router.put('/api/test/admin/eshop/onlinePayment', order.onlinePayment);

//通过手机号，代售id查所有订单
router.get('/api/test/customer/deal/consignee/order', order.getUserEshopConsigneeOrder.bind(order));
router.get('/api/test/customer/eshop/consignee/order', order.getUserEshopConsigneeOrder.bind(order));

module.exports = router
