let order = require('../../controller/customer/order');

const router = new (require('koa-router'))()

router.get('/api/test/customer/deal/order', order.getUserDealOrder);

router.post('/api/test/customer/deal/order', order.saveUserDealOrder);

router.post('/api/test/customer/eshop/order', order.saveUserEshopOrder);

router.put('/api/test/customer/eshop/order', order.updateUserEshopOrder);

router.delete('/api/test/customer/eshop/order', order.deleteUserEshopOrder);

router.get('/api/test/customer/eshop/order', order.getUserEshopOrder);

module.exports = router
